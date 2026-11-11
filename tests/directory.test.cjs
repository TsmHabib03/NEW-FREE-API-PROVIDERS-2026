const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');

// A DOM double exercises the real event handlers and generated markup. It does
// not claim to verify browser rendering, accessibility trees or native focus.
const NOTICE_KEY = 'aip2026.community-notice';
const noticeRecord = disposition => JSON.stringify({ version: '2026-11-v1', disposition });
function harness(fixtures, options = {}) {
  const nodes = new Map(), events = {}, windowEvents = {};
  let document;
  class Element {
    constructor(selector) {
      this.selector = selector; this.dataset = {}; this.attributes = {};
      this.hidden = /modal|backdrop/.test(selector); this.inert = false;
      this.innerHTML = ''; this.textContent = ''; this.value = '';
      this.offsetParent = {}; this.style = {}; this.listeners = {};
      this.isConnected = true; this.scrollTop = 0;
      this.classes = new Set();
      this.classList = {
        add: name => this.classes.add(name), remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name)
      };
    }
    matches(selector) { return this.selector === selector; }
    closest(selector) { return this.matches(selector) ? this : null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    removeAttribute(name) { delete this.attributes[name]; }
    focus() { document.activeElement = this; }
    contains(element) { return element === this || element.scope === this.selector; }
    scrollIntoView(options) { this.scrolled = options; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    querySelector(selector) { return get(selector); }
    querySelectorAll(selector) { return queryAll(selector, this); }
  }
  const get = selector => {
    if (!nodes.has(selector)) nodes.set(selector, new Element(selector));
    return nodes.get(selector);
  };
  const queryAll = (selector, scope) => {
    if (selector === '[data-collection]') return collections;
    if (selector === '[data-theme-toggle]') return [get(selector)];
    if (selector === 'meta[name="theme-color"]') return [get(selector)];
    if (selector === '.topbar,.directory-intro,.directory-main,.footer')
      return selector.split(',').map(get);
    if (selector.includes('a[href]') || selector.includes('button,input')) {
      const controls = scope?.selector === '[data-community-modal]'
        ? ['[data-community-close]', '[data-community-acknowledge]']
        : scope?.selector === '[data-guide-modal]'
          ? ['[data-guide-close]', '[data-copy-code]', '[data-guide-link]']
          : scope?.selector === '.filter-sidebar'
            ? ['[data-filters-close]', 'filter-input'] : ['[data-prov-close]', '[data-guide-open]'];
      return controls.map(selector => { const el = get(selector); el.scope = scope?.selector; return el; });
    }
    return [];
  };
  document = {
    body: get('body'), documentElement: get('html'), activeElement: get('initial-focus'),
    querySelector: get, querySelectorAll: queryAll,
    addEventListener: (type, cb) => events[type] = cb
  };
  document.documentElement.dataset.theme = 'light';
  const collections = ['all', 'picks', 'newapi', 'recommended', 'offline'].map(key => {
    const el = new Element('[data-collection]'); el.dataset.collection = key; return el;
  });
  const storage = options.storage || new Map(options.fresh ? [] : [[NOTICE_KEY, noticeRecord('dismissed')]]);
  const session = options.session || new Map();
  const makeStorage = (map, name) => ({
    getItem(key) { if (options[name + 'ReadFails']) throw Error('Storage blocked'); return map.get(key) ?? null; },
    setItem(key, value) { if (options[name + 'WriteFails']) throw Error('Storage full'); map.set(key, value); }
  });
  const localApi = makeStorage(storage, 'local'), sessionApi = makeStorage(session, 'session');
  const window = { innerWidth: 1440, addEventListener: (type, cb) => windowEvents[type] = cb };
  Object.defineProperties(window, {
    localStorage: { get() { if (options.localGetterFails) throw Error('Storage blocked'); return localApi; } },
    sessionStorage: { get() { if (options.sessionGetterFails) throw Error('Storage blocked'); return sessionApi; } }
  });
  for (const selector of ['[data-community-title]', '[data-community-panel]', '[data-community-reading]', '[data-community-close]', '[data-community-acknowledge]']) get(selector).scope = '[data-community-modal]';
  if (options.missingReading) nodes.set('[data-community-reading]', null);
  const context = vm.createContext({
    document, window,
    location: { href: 'http://localhost:8080/index.html#main-content', hash: '#main-content' }, URL, HTMLElement: Element,
    HTMLImageElement: Element, navigator: {}, console, setTimeout, clearTimeout,
    localStorage: localApi
  });
  vm.runInContext(source('js/providers.js'), context);
  if (fixtures) context.window.PROVIDERS = fixtures;
  vm.runInContext(source('js/adapters.js'), context);
  vm.runInContext(source('js/views.js'), context);
  const emit = (type, target, rest = {}) => {
    const event = { target, key: '', preventDefault() { this.prevented = true; }, ...rest };
    events[type](event); return event;
  };
  const target = (selector, dataset = {}) => Object.assign(new Element(selector), { dataset });
  const change = (group, value, checked = true) => {
    const el = target('[data-filter-group]', { filterGroup: group });
    el.value = value; el.checked = checked; emit('change', el);
  };
  const search = query => {
    get('[data-search-input]').value = query;
    get('[data-search-input]').listeners.input();
  };
  const ids = () => [...get('[data-provider-grid]').innerHTML.matchAll(/data-provider-id="([^"]+)"/g)].map(m => m[1]);
  return { context, get, emit, target, change, search, ids, document, windowEvents, storage, session };
}

test('all source providers appear once, with feature lists and three honest metrics', () => {
  const h = harness(), records = h.context.window.PROVIDERS;
  assert.equal(records.length, 69);
  assert.equal(h.ids().length, records.length);
  assert.equal(new Set(h.ids()).size, records.length);
  assert.deepEqual(new Set(h.ids()), new Set(records.map(p => p.id)));
  const markup = h.get('[data-provider-grid]').innerHTML;
  assert.equal((markup.match(/class="api-features"/g) || []).length, records.length);
  assert.equal((markup.match(/class="api-metrics"/g) || []).length, records.length);
  assert.equal((markup.match(/Not listed/g) || []).length, records.filter(p => !p.rewards).length * 3);
  assert.equal(h.context.window.Adapters.stats.off, 14);
});

test('every card and modal preserve exact provider endpoints and disable only offline/missing URLs', () => {
  const h = harness(), A = h.context.window.Adapters;
  const markup = h.get('[data-provider-grid]').innerHTML;
  for (const p of A.providers) {
    // Feature list closes with </ul>; split by the next card rather than nested li.
    const segment = markup.split('data-provider-id="' + p.id + '"')[1].split('<li class="api-card')[0];
    const docs = A.docsUrl(p);
    if (!p.rewards) assert.ok(segment.includes('href="' + A.esc(docs) + '"'), p.id + ' docs');
    const opener = h.target('[data-prov-open]', { provOpen: p.id }); opener.focus();
    h.emit('click', opener);
    assert.equal(h.get('[data-prov-modal-name]').textContent, p.name);
    assert.equal(h.get('[data-prov-modal-logo]').src, A.logo(p));
    assert.equal(h.get('[data-prov-modal-blurb]').textContent, p.blurb);
    const actions = h.get('.prov-act').innerHTML;
    if (!p.rewards) assert.ok(actions.includes('href="' + A.esc(docs) + '"'), p.id + ' modal docs');
    if (p.status === 'off' || !p.url) {
      assert.ok(actions.includes('aria-disabled="true"'), p.id);
      assert.ok(!actions.includes('class="prov-signin"'), p.id);
      assert.ok(segment.includes('api-signup is-disabled'), p.id);
    } else {
      assert.ok(segment.includes('href="' + A.esc(p.url) + '"'), p.id + ' card signup');
      assert.ok(actions.includes('href="' + A.esc(p.url) + '"'), p.id + ' modal signup');
    }
    assert.equal(h.get('[data-prov-docs-note]').hidden, !!p.rewards || docs !== 'setup.html');
    assert.equal(h.get('[data-prov-rewards]').hidden, !p.rewards);
    assert.equal(h.get('.prov-technical').hidden, !!p.rewards);
    assert.equal(h.get('[data-prov-modal-route]').hidden, !!p.rewards);
    if (p.rewards) {
      assert.deepEqual([...segment.matchAll(/href="([^"]+)"/g)].map(m => m[1]), [A.esc(p.url)]);
      assert.deepEqual([...actions.matchAll(/href="([^"]+)"/g)].map(m => m[1]), [A.esc(p.url)]);
      assert.ok(actions.includes(A.esc('Join ' + p.name + ' & earn rewards')));
      assert.ok(segment.includes('Join &amp; earn rewards'));
      assert.ok(!segment.includes('Models not documented'));
      assert.ok(h.get('[data-prov-rewards]').innerHTML.includes('USDT (BEP20)'));
      assert.ok(h.get('[data-prov-rewards]').innerHTML.includes('$100'));
      assert.ok(h.get('[data-prov-rewards]').innerHTML.includes('no fixed or guaranteed returns'));
    }
    h.context.window.Views.closeModal();
    assert.equal(h.document.activeElement, opener);
  }
});

test('ArtBloom return enables the exact new signup link and resets its badge when switching providers', () => {
  const h = harness(), A = h.context.window.Adapters;
  const artbloom = A.providers.find(p => p.id === 'artbloom');
  assert.equal(artbloom.status, 'live');
  assert.equal(artbloom.url, 'https://api.artbloom.tech/signup?ref=EQJPJADV5U');
  assert.equal(artbloom.addedAt, '2026-09-29');
  assert.equal(A.isReturned(artbloom), true);
  assert.equal(artbloom.statusNote, undefined);
  const markup = h.get('[data-provider-grid]').innerHTML;
  const card = markup.split('data-provider-id="artbloom"')[1].split('<li class="api-card')[0];
  assert.ok(card.includes('ArtBloom is back'));
  assert.ok(card.includes('href="' + artbloom.url + '"'));
  assert.ok(!card.includes('api-signup is-disabled'));
  h.context.window.Views.openProvider('artbloom');
  assert.equal(h.get('[data-prov-modal-return]').hidden, false);
  assert.equal(h.get('[data-prov-modal-return]').textContent, 'ArtBloom is back');
  assert.ok(h.get('.prov-act').innerHTML.includes('href="' + artbloom.url + '"'));
  assert.equal(h.get('[data-prov-modal-notice]').hidden, true);
  h.context.window.Views.openProvider('qronos');
  assert.equal(h.get('[data-prov-modal-return]').hidden, true);
  assert.equal(h.get('[data-prov-modal-return]').textContent, '');

  const fixtures = A.providers.map(p => p.id === 'artbloom' ? { ...p, status: 'off' } : p);
  const offline = harness(fixtures);
  assert.equal(offline.context.window.Adapters.isReturned(fixtures.find(p => p.id === 'artbloom')), false);
  assert.ok(!offline.get('[data-provider-grid]').innerHTML.includes('ArtBloom is back'));
  offline.context.window.Views.openProvider('artbloom');
  assert.equal(offline.get('[data-prov-modal-return]').hidden, true);
  assert.ok(!offline.get('.prov-act').innerHTML.includes('class="prov-signin"'));
});

test('ArtBloom setup tab is enabled, uses the shared signup/guide URLs, and is absent from the offline notice', () => {
  const h = harness();
  const p = h.context.window.PROVIDERS.find(p => p.id === 'artbloom');
  const panels = ['agentrouter', 'artbloom'].map(id => h.target('[data-panel]', { panel: id }));
  const tabs = panels.map(panel => h.target('[data-tab]', { tab: panel.dataset.panel }));
  const queryAll = h.document.querySelectorAll;
  h.document.querySelectorAll = selector => selector === '[data-tabs]' ? [h.get('[data-tabs]')]
    : selector === '[data-panel]' ? panels : selector === '[data-tab]' ? tabs : queryAll(selector);
  h.get('[data-tabs]').querySelectorAll = h.document.querySelectorAll;
  const queryOne = h.document.querySelector;
  h.document.querySelector = selector => selector === '[data-panel="artbloom"]' ? panels[1]
    : selector === '[data-tab="artbloom"]' ? tabs[1] : queryOne(selector);
  tabs[1].click = () => tabs[1].listeners.click();
  h.context.window.setTimeout = () => 0;
  h.context.location.hash = '#artbloom';
  h.context.CSS = { escape: value => value };
  vm.runInContext(source('js/setup.js'), h.context);
  const tabMarkup = h.get('[data-tab-strip]').innerHTML.match(/<button[^>]*data-tab="artbloom"[^>]*>/)[0];
  assert.ok(!tabMarkup.includes('disabled'));
  assert.equal(tabs[1].attributes['aria-selected'], 'true');
  assert.equal(panels[1].classList.contains('active'), true);
  assert.equal(h.get('[data-artbloom-signup]').href, p.url);
  assert.equal(h.get('[data-artbloom-signup]').hidden, false);
  assert.equal(h.get('[data-artbloom-guide]').href, p.guide);
  assert.ok(source('setup.html').includes('ArtBloom is back'));
  assert.ok(!h.get('[data-offline-text]').textContent.includes('ArtBloom'));
  assert.ok(!source('setup.html').includes('ArtBloom is no longer accessible'));
});

test('recommended UTIM keeps its API signup and adds a separate official website action', () => {
  const h = harness(), A = h.context.window.Adapters;
  const utim = A.providers.find(p => p.id === 'utim');
  const pixrouter = A.providers.find(p => p.id === 'pixrouter');
  assert.equal(utim.recommended, true);
  assert.equal(pixrouter.recommended, true);
  assert.ok(A.collections.find(c => c.key === 'picks').items.some(p => p.id === 'utim'));
  h.emit('click', h.target('[data-prov-open]', { provOpen: 'utim' }));
  const actions = h.get('.prov-act').innerHTML;
  assert.ok(actions.includes('href="https://utim.dev/"'));
  assert.ok(actions.includes('Use its official website'));
  assert.ok(actions.includes('href="https://utim.dev/auth?mode=signup&amp;ref=278c8461"'));
  assert.ok(actions.includes('Get API'));
});

test('featured providers keep accurate referral actions under search and offline states', () => {
  const h = harness(), A = h.context.window.Adapters;
  assert.equal(A.providers.find(p => p.id === 'adselect').url, 'https://adselect.biz/register?ref=tsmhabib03');
  const expected = [
    ['zurelay', 'https://zurelay.com/signup?ref=HABI6Z6Z', 'assets/zurelay-logo.svg', 'Get API'],
    ['qoder', 'https://qoder.com/activities?referral_code=J7alB0RB6kGqmZGIqbVuC0VWwVNVEpXy', 'assets/qoder-logo.png', 'Open activities']
  ];
  for (const [id, url, logo, action] of expected) {
    const p = A.providers.find(p => p.id === id);
    assert.equal(p.url, url);
    assert.equal(p.logo, logo);
    assert.ok(fs.existsSync(path.join(root, logo)));
    h.search(p.name);
    assert.deepEqual(h.ids(), [id]);
    const markup = h.get('[data-provider-grid]').innerHTML;
    assert.ok(markup.includes('api-featured'));
    assert.ok(markup.includes('>Featured</span>'));
    assert.ok(markup.includes('href="' + A.esc(url) + '"'));
    assert.ok(markup.includes('>' + action + '<i'));
    h.context.window.Views.openProvider(id);
    assert.ok(h.get('.prov-act').innerHTML.includes('>' + action + '<i'));
    h.context.window.Views.closeModal();
  }
  h.search('Qoder');
  assert.ok(!h.get('[data-provider-grid]').innerHTML.includes('Get API'));
  h.change('protocol', 'openai');
  assert.deepEqual(h.ids(), []);
  h.search('Zurelay');
  assert.deepEqual(h.ids(), ['zurelay']);
  const fixtures = A.providers.map(p => p.featured ? { ...p, status: 'off' } : p);
  const offline = harness(fixtures);
  assert.ok(!offline.get('[data-provider-grid]').innerHTML.includes('api-featured'));
  for (const key of ['all', 'picks']) {
    const ids = offline.context.window.Adapters.collections.find(c => c.key === key).items.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    if (key === 'picks') assert.ok(!ids.includes('zurelay') && !ids.includes('qoder') && !ids.includes('agentrouter'));
  }
});

test('checkboxes use OR within groups and AND across groups; search includes offline models', () => {
  const h = harness(), A = h.context.window.Adapters;
  h.change('status', 'off');
  assert.deepEqual(new Set(h.ids()), new Set(A.providers.filter(A.isOff).map(p => p.id)));
  h.change('status', 'live');
  h.change('auth', 'api-key');
  h.change('protocol', 'openai');
  const expected = A.providers.filter(p => ['off', 'live'].includes(p.status) &&
    A.authTypes(p).includes('api-key') && (p.protocol || []).includes('openai'));
  assert.deepEqual(new Set(h.ids()), new Set(expected.map(p => p.id)));
  h.emit('click', h.target('[data-reset-all]'));
  const p = A.providers.find(p => p.status === 'off');
  h.search(p.name);
  assert.ok(h.ids().includes(p.id));
  h.search('no-provider-could-match-this-query');
  assert.equal(h.ids().length, 0); assert.equal(h.get('[data-search-empty]').hidden, false);
  h.emit('click', h.target('[data-reset-all]'));
  const model = A.providers.find(p => p.models?.length).models[0];
  h.search(model);
  assert.ok(h.ids().length > 0);
});

test('collections and sort controls update generated cards', () => {
  const h = harness(), A = h.context.window.Adapters;
  assert.equal(h.ids()[h.ids().indexOf('tokenforge') + 1], 'qronos');
  assert.deepEqual(h.ids().slice(0, 6), ['pixrouter', 'adselect', 'zurelay', 'agentrouter', 'qoder', 'utim']);
  for (const collection of A.collections) {
    h.emit('click', h.target('[data-collection]', { collection: collection.key }));
    assert.deepEqual(new Set(h.ids()), new Set(collection.items.map(p => p.id)));
    if (['all', 'picks'].includes(collection.key)) {
      assert.equal(h.ids()[h.ids().indexOf('tokenforge') + 1], 'qronos');
      assert.deepEqual(h.ids().slice(0, 6), ['pixrouter', 'adselect', 'zurelay', 'agentrouter', 'qoder', 'utim']);
    }
  }
  h.emit('click', h.target('[data-collection]', { collection: 'all' }));
  const select = h.target('[data-sort-select]'); select.value = 'name'; h.emit('change', select);
  assert.deepEqual(h.ids(), [...A.providers].sort((a,b) => a.name.localeCompare(b.name)).map(p => p.id));
  select.value = 'newest'; h.emit('change', select);
  assert.deepEqual(h.ids(), [...A.collections[0].items].sort((a,b) =>
    String(b.updatedAt || b.addedAt || '').localeCompare(String(a.updatedAt || a.addedAt || '')) || a.name.localeCompare(b.name)).map(p => p.id));
});

test('modal swapping, nested MuseAI guide, Escape and drawer restore state', () => {
  const h = harness(); const initial = h.document.activeElement;
  h.context.window.Views.openProvider('museai');
  assert.equal(h.get('[data-directory-shell]').inert, true);
  h.emit('click', h.target('[data-guide-open]'));
  assert.equal(h.get('[data-guide-modal]').hidden, false);
  assert.equal(h.get('[data-prov-card]').inert, true);
  assert.equal(h.get('[data-copy-code]').dataset.copyCode, 'M0J1WF');
  assert.equal((h.get('[data-guide-steps]').innerHTML.match(/<li>/g) || []).length, 7);
  h.emit('keydown', h.get('[data-guide-close]'), { key: 'Escape' });
  assert.equal(h.get('[data-guide-modal]').hidden, true);
  assert.equal(h.get('[data-prov-card]').inert, false);
  h.context.window.Views.openProvider('agentrouter');
  assert.equal(h.get('[data-prov-modal-name]').textContent, 'AgentRouter');
  h.emit('keydown', h.get('[data-prov-close]'), { key: 'Escape' });
  assert.equal(h.get('[data-prov-modal]').hidden, true);
  assert.equal(h.get('[data-directory-shell]').inert, false);
  assert.equal(h.document.activeElement, initial);
  const toggle = h.target('[data-filters-toggle]'); toggle.focus(); h.emit('click', toggle);
  assert.equal(h.document.body.classList.contains('filters-open'), true);
  assert.equal(h.get('.directory-main').inert, true);
  h.emit('keydown', h.get('[data-filters-close]'), { key: 'Escape' });
  assert.equal(h.document.body.classList.contains('filters-open'), false);
  assert.equal(h.get('.directory-main').inert, false);
  assert.equal(h.document.activeElement, toggle);
});

test('optional data supports new categories/auth, zero metrics, invalid values and safe URL routing', () => {
  const fixture = { id: 'sample', name: '<Sample>', status: 'live', models: [], protocol: [], flags: [],
    category: ['Weather', 'Finance'], authType: ['oauth', 'none'], dataFormat: 'JSON',
    blurb: 'Weather and finance', metrics: { requestsPerMinute: 0, latencyMs: 85, uptimePercent: 99.9 },
    url: 'https://example.com/signup?ref=literal&keep=%2F', docsUrl: 'https://example.com/docs' };
  const h = harness([fixture]), A = h.context.window.Adapters;
  assert.deepEqual(Array.from(A.metrics(fixture), m => m.display), ['0', '85 ms', '99.9%']);
  assert.deepEqual(Array.from(A.metrics({ metrics: { requestsPerMinute: -1, latencyMs: '85', uptimePercent: 101 } }), m => m.value), [null, null, null]);
  assert.deepEqual(Array.from(A.metrics({ metrics: { requestsPerMinute: null, latencyMs: NaN, uptimePercent: Infinity } }), m => m.value), [null, null, null]);
  h.change('category', 'Weather'); h.change('auth', 'oauth'); assert.deepEqual(h.ids(), ['sample']);
  h.context.window.Views.openProvider('sample');
  assert.equal(h.get('[data-prov-modal-name]').textContent, '<Sample>');
  assert.ok(h.get('[data-provider-grid]').innerHTML.includes('&lt;Sample&gt;'));
  fixture.url = 'javascript:alert(1)'; fixture.docsUrl = 'javascript:alert(1)';
  h.context.window.Views.openProvider('sample');
  assert.ok(!h.get('.prov-act').innerHTML.includes('javascript:'));
  assert.ok(h.get('.prov-act').innerHTML.includes('href="setup.html"'));
});

test('HTML contains every static view hook; CSS parses; theme toggle exposes dark state', () => {
  const html = source('index.html'), views = source('js/views.js');
  const dynamic = new Set(['data-filter-group', 'data-collection', 'data-remove-filter', 'data-provider-id', 'data-prov-open']);
  for (const [, hook] of views.matchAll(/\[([\w-]+)\]/g)) {
    if (hook.startsWith('data-') && !dynamic.has(hook)) assert.ok(html.includes(hook), hook);
  }
  require('postcss').parse(source('css/directory.css'));
  const h = harness(); vm.runInContext(source('js/theme.js'), h.context);
  assert.equal(h.get('[data-theme-toggle]').attributes['aria-pressed'], 'false');
  h.get('[data-theme-toggle]').listeners.click({ preventDefault() {} });
  assert.equal(h.document.documentElement.dataset.theme, 'dark');
  assert.equal(h.get('[data-theme-toggle]').attributes['aria-pressed'], 'true');
});

test('fresh visit opens notice after rendering directory and locks background including skip link', () => {
  const h = harness(null, { fresh: true });
  assert.equal(h.get('[data-community-modal]').hidden, false);
  assert.equal(h.get('[data-community-open]').hidden, false);
  assert.equal(h.document.activeElement, h.get('[data-community-title]'));
  assert.equal(h.get('[data-directory-shell]').inert, true);
  assert.equal(h.get('.skip-link').inert, true);
  assert.equal(h.document.body.classList.contains('modal-open'), true);
  assert.equal(h.ids().length, 69);
  assert.equal(h.storage.has(NOTICE_KEY), false);
  h.emit('click', h.target('[data-prov-open]', { provOpen: 'museai' }));
  assert.equal(h.get('[data-prov-modal]').hidden, true);
  h.emit('click', h.get('[data-community-panel]'));
  assert.equal(h.get('[data-community-modal]').hidden, false);
});

test('each intentional exit persists its own disposition and suppresses reload popup', () => {
  for (const [selector, disposition, key] of [
    ['[data-community-acknowledge]', 'acknowledged'],
    ['[data-community-close]', 'dismissed'],
    ['[data-community-modal]', 'dismissed'],
    ['[data-community-title]', 'dismissed', 'Escape']
  ]) {
    const h = harness(null, { fresh: true });
    h.emit(key ? 'keydown' : 'click', h.get(selector), key ? { key } : {});
    assert.equal(h.storage.get(NOTICE_KEY), noticeRecord(disposition), selector);
    assert.equal(h.get('[data-community-modal]').hidden, true);
    assert.equal(h.document.activeElement, h.get('#main-content'));
    assert.equal(h.get('[data-directory-shell]').inert, false);
    assert.equal(h.get('.skip-link').inert, false);
    assert.equal(h.document.body.classList.contains('modal-open'), false);
    const reloaded = harness(null, { storage: h.storage, session: h.session });
    assert.equal(reloaded.get('[data-community-modal]').hidden, true, selector);
  }
});

test('current preferences suppress auto-open; older, malformed or unknown records recover', () => {
  for (const raw of [noticeRecord('acknowledged'), noticeRecord('dismissed')]) {
    assert.equal(harness(null, { storage: new Map([[NOTICE_KEY, raw]]) }).get('[data-community-modal]').hidden, true);
  }
  for (const raw of ['broken-json', 'null', '{}', JSON.stringify({ version: 'old', disposition: 'acknowledged' }),
    JSON.stringify({ version: '2026-11-v1', disposition: 'unexpected' })]) {
    const h = harness(null, { storage: new Map([[NOTICE_KEY, raw]]) });
    assert.equal(h.get('[data-community-modal]').hidden, false, raw);
    h.emit('click', h.get('[data-community-close]'));
    assert.equal(h.storage.get(NOTICE_KEY), noticeRecord('dismissed'));
  }
});

test('manual reopen restores trigger focus, resets reading position and preserves acknowledgment', () => {
  const h = harness(null, { storage: new Map([[NOTICE_KEY, noticeRecord('acknowledged')]]) });
  const opener = h.get('[data-community-open]');
  opener.focus();
  h.get('[data-community-reading]').scrollTop = 250;
  h.get('[data-community-panel]').scrollTop = 350;
  h.emit('click', opener);
  assert.equal(h.get('[data-community-reading]').scrollTop, 0);
  assert.equal(h.get('[data-community-panel]').scrollTop, 0);
  assert.equal(h.document.activeElement, h.get('[data-community-title]'));
  h.emit('click', h.get('[data-community-close]'));
  assert.equal(h.document.activeElement, opener);
  assert.equal(h.storage.get(NOTICE_KEY), noticeRecord('acknowledged'));
  opener.focus(); h.emit('click', opener); opener.isConnected = false;
  h.emit('keydown', h.get('[data-community-title]'), { key: 'Escape' });
  assert.equal(h.document.activeElement, h.get('#main-content'));
});

test('storage getter/read/write failures fall back to session and page memory without blocking exit', () => {
  for (const failure of ['localGetterFails', 'localReadFails', 'localWriteFails']) {
    const h = harness(null, { fresh: true, [failure]: true });
    h.emit('click', h.get('[data-community-acknowledge]'));
    assert.equal(h.session.get(NOTICE_KEY), noticeRecord('acknowledged'));
    const reload = harness(null, { fresh: true, session: h.session, [failure]: true });
    assert.equal(reload.get('[data-community-modal]').hidden, true, failure);
  }
  for (const options of [
    { localGetterFails: true, sessionGetterFails: true },
    { localReadFails: true, sessionReadFails: true, localWriteFails: true, sessionWriteFails: true }
  ]) {
    const h = harness(null, { fresh: true, ...options });
    h.emit('click', h.get('[data-community-acknowledge]'));
    assert.equal(h.get('[data-community-modal]').hidden, true);
    h.context.window.Views.openNotice(true);
    assert.equal(h.get('[data-community-modal]').hidden, true, 'memory suppresses a second automatic attempt');
    const opener = h.get('[data-community-open]'); opener.focus(); h.emit('click', opener);
    assert.equal(h.get('[data-community-modal]').hidden, false, 'manual reopening bypasses memory');
    h.emit('click', h.get('[data-community-close]'));
    assert.equal(h.document.activeElement, opener);
  }
});

test('notice traps title/edge focus and guards search shortcuts/outside focus', () => {
  const h = harness(null, { fresh: true }), title = h.get('[data-community-title]');
  const close = h.get('[data-community-close]'), acknowledge = h.get('[data-community-acknowledge]');
  assert.equal(h.emit('keydown', title, { key: 'Tab' }).prevented, true);
  assert.equal(h.document.activeElement, close);
  assert.equal(h.emit('keydown', close, { key: 'Tab' }).prevented, undefined, 'native Tab can reach acknowledgment');
  h.emit('keydown', close, { key: 'Tab', shiftKey: true });
  assert.equal(h.document.activeElement, acknowledge);
  h.emit('keydown', acknowledge, { key: 'Tab' });
  assert.equal(h.document.activeElement, close);
  title.focus(); h.emit('keydown', title, { key: 'Tab', shiftKey: true });
  assert.equal(h.document.activeElement, acknowledge);
  for (const modifier of ['ctrlKey', 'metaKey']) {
    assert.equal(h.emit('keydown', acknowledge, { key: 'k', [modifier]: true }).prevented, true);
    assert.equal(h.document.activeElement, acknowledge);
  }
  h.get('.skip-link').focus(); h.emit('focusin', h.get('.skip-link'));
  assert.equal(h.document.activeElement, title);
  h.emit('click', close);
  h.emit('keydown', h.get('#main-content'), { key: 'k', ctrlKey: true });
  assert.equal(h.document.activeElement, h.get('[data-search-input]'));
});

test('notice exits preserve filters, search, sorting, collection and URL', () => {
  for (const selector of ['[data-community-acknowledge]', '[data-community-close]']) {
    const h = harness();
    h.change('status', 'live'); h.search('api');
    h.emit('click', h.target('[data-collection]', { collection: 'recommended' }));
    const sort = h.target('[data-sort-select]'); sort.value = 'name'; h.emit('change', sort);
    const ids = h.ids(), href = h.context.location.href, opener = h.get('[data-community-open]');
    opener.focus(); h.emit('click', opener); h.emit('click', h.get(selector));
    assert.deepEqual(h.ids(), ids);
    assert.equal(h.get('[data-search-input]').value, 'api');
    assert.equal(h.context.location.href, href);
    assert.equal(h.document.activeElement, opener);
    assert.equal(h.get('[data-community-reading]').scrollTop, 0);
  }
});

test('notice/provider/guide/drawer transitions keep one top-level overlay and release locks', () => {
  const h = harness();
  h.context.window.Views.openProvider('museai');
  h.emit('click', h.get('[data-guide-open]'));
  h.context.window.Views.openNotice(true);
  assert.equal(h.get('[data-community-modal]').hidden, true);
  h.context.window.Views.openNotice();
  assert.equal(h.get('[data-prov-modal]').hidden, true);
  assert.equal(h.get('[data-guide-modal]').hidden, true);
  assert.equal(h.get('[data-prov-card]').inert, false);
  assert.equal(h.get('[data-directory-shell]').inert, true);
  h.context.window.Views.openProvider('museai');
  assert.equal(h.get('[data-community-modal]').hidden, true);
  assert.equal(h.get('[data-prov-modal]').hidden, false);
  assert.equal(h.get('[data-directory-shell]').inert, true);
  h.context.window.Views.closeModal();
  h.emit('click', h.get('[data-filters-toggle]'));
  h.context.window.Views.openNotice();
  assert.equal(h.document.body.classList.contains('filters-open'), false);
  assert.equal(h.get('.directory-main').inert, false);
  assert.equal(h.get('[data-directory-shell]').inert, true);
  h.emit('click', h.get('[data-community-close]'));
  assert.equal(h.get('[data-directory-shell]').inert, false);
  assert.equal(h.document.body.classList.contains('modal-open'), false);
});

test('notice initialization error leaves directory interactive', () => {
  const h = harness(null, { fresh: true, missingReading: true });
  assert.equal(h.get('[data-community-modal]').hidden, true);
  assert.equal(h.get('[data-directory-shell]').inert, false);
  assert.equal(h.document.body.classList.contains('modal-open'), false);
  assert.equal(h.ids().length, 69);
});

test('notice markup has exact approved copy, existing favicon, decorative mosaic and one CTA', () => {
  const html = source('index.html');
  const notice = html.slice(html.indexOf('<div class="community-veil"'), html.indexOf('<script', html.indexOf('<div class="community-veil"')));
  const paragraphs = [...notice.matchAll(/<p class="community-[^"]+">([^<]+)<\/p>/g)].map(match => match[1]);
  assert.deepEqual(paragraphs, [
    'FREE-API-PROVIDERS is an independent directory for discovering free and free-tier AI APIs. We do not own, operate, or guarantee the services listed.',
    'We also encourage visitors to evaluate promotional recommendations and referral links independently.',
    'Our commitment remains transparency, reliable information, and helping developers discover useful AI resources.'
  ]);
  assert.ok(notice.includes('role="dialog" aria-modal="true" aria-labelledby="community-title"'));
  assert.ok(notice.includes('class="community-mosaic" aria-hidden="true"'));
  assert.equal((notice.match(/<span><\/span>/g) || []).length, 24);
  assert.ok(notice.includes('src="assets/gorouterlogo.png" alt=""'));
  assert.equal((notice.match(/<button/g) || []).length, 2, 'X and a single acknowledgment CTA');
  assert.ok(notice.includes('Acknowledge &amp; Continue'));
  assert.ok(!notice.includes('data-community-browse'));
  assert.ok(!notice.includes('community-cards'));
});
