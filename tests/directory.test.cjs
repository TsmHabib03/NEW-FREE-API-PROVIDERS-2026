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
    closest(selector) { return selector.split(',').some(item=>this.matches(item.trim())) ? this : null; }
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

test('canonical order covers all records once and preserves approved pins and installed order', () => {
  const h=harness(), A=h.context.window.Adapters;
  assert.equal(A.providers.length,73);
  assert.equal(A.canonical.length,73);
  assert.equal(new Set(A.canonical.map(p=>p.id)).size,73);
  assert.deepEqual(Array.from(A.canonical.slice(0,4),p=>p.id),['pixrouter','agentrouter','tokenforge','artbloom']);
  assert.deepEqual(Array.from(A.sections.find(s=>s.key==='installed').items,p=>p.id),['utim','qoder','zcode','freepi','omnirush']);
  assert.equal(A.sections.find(s=>s.key==='disabled').items.length,18);
  assert.equal(A.providers.some(p=>p.id==='threerouter'),false);
  assert.equal(A.providers.find(p=>p.id==='helyx').status,'off');
  const markup=h.get('[data-provider-grid]').innerHTML;
  assert.match(markup,/id="panel-review" hidden/);
  assert.match(markup,/id="panel-disabled" hidden/);
  assert.match(markup,/Show all \(10\)/);
});

test('approved badges, exact referral URLs, current models and logo reuse remain intact', () => {
  const A=harness().context.window.Adapters, by=id=>A.providers.find(p=>p.id===id);
  assert.ok(by('pixrouter').badges.includes('Image Generation'));
  assert.equal(by('pixrouter').signupCredit,false);
  assert.equal(by('pixrouter').noCard,false);
  assert.ok(by('tokenforge').badges.includes('Starter credit (amount not confirmed)'));
  assert.ok(by('artbloom').badges.includes('Back'));
  assert.ok(by('omnirush').badges.includes('Unverified'));
  assert.equal(by('aetherai').url,'https://aether.cesiummc.space/sign-up?aff=XfVv');
  assert.equal(by('byesu').url,'https://byesu.com/sign-up?aff=CCci');
  assert.ok(by('aetherai').badges.includes('Referral'));
  assert.ok(by('byesu').badges.includes('Referral'));
  assert.equal(by('aetherai').logo,by('gorouter').logo);
  assert.deepEqual(Array.from(by('agentrouter').models),['gpt-6-astra','gpt-6.1-sol','gpt-5.6-sol']);
  assert.equal(by('tokenforge').models.length,11);
});

test('New requires all Checked evidence, live signup, date and exclusive 14-day window', () => {
  const A=harness().context.window.Adapters;
  const now=Date.parse('2026-11-16T08:00:00Z');
  const fixture={id:'fixture',name:'Fixture',status:'live',addedAt:'2026-11-03',check:{level:'checked',siteLive:true,signupExists:true,termsDocumented:true,terms:'Documented offer',sources:['https://example.com/terms'],checkedAt:'2026-11-16T00:00:00Z'}};
  assert.equal(A.isNew(fixture,now),true);
  assert.equal(A.isNew(fixture,Date.parse('2026-11-16T16:00:00Z')),false);
  assert.equal(A.isNew({...fixture,addedAt:'2026-11-17'},now),false);
  for(const field of ['siteLive','signupExists','termsDocumented']) assert.equal(A.isNew({...fixture,check:{...fixture.check,[field]:false}},now),false,field);
  assert.equal(A.isNew({...fixture,check:{...fixture.check,checkedAt:'invalid'}},now),false);
  assert.equal(A.isNew({...fixture,check:{...fixture.check,checkedAt:'2026-11-17T00:00:00Z'}},now),false);
  assert.equal(A.isNew({...fixture,status:'review'},now),false);
  assert.ok(A.newItems(now).length<=5);
  assert.deepEqual(Array.from(A.newItems(now),p=>p.id),['aetherai','byesu','tokeness','truesota','xingchiapi']);
  assert.equal(A.newItems(now+20*864e5).length,0);
});

test('Spotlight requires recent successful account and inference evidence and rotates weekly', () => {
  const now=Date.parse('2026-11-16T08:00:00Z'), A=harness().context.window.Adapters;
  const verification={accountAccess:true,inferenceSuccess:true,source:'Audit record',verifiedAt:'2026-11-16T00:00:00Z'};
  const fixture={status:'live',verification};
  assert.equal(A.verified(fixture,now),true);
  assert.equal(A.verified({...fixture,verification:{...verification,inferenceSuccess:false}},now),false);
  assert.equal(A.verified(fixture,Date.parse(verification.verifiedAt)+30*864e5),false);
  assert.equal(A.spotlight(now),null);
  assert.equal(A.weekStart(now),Date.parse('2026-11-15T16:00:00Z'));
  const items=A.sections.find(s=>s.key==='gateways').items.slice(6,8);
  items.forEach(p=>{p.verification=verification;p.addedAt='2026-01-01';});
  assert.ok(items.includes(A.spotlight(now)));
  assert.notEqual(A.spotlight(now),A.spotlight(now+7*864e5));
});

test('search reaches hidden category tails and archives, filters auto-expand, pins never reorder', () => {
  const h=harness();
  h.search('XingchiAPI'); assert.ok(h.ids().includes('xingchiapi'));
  h.search('Helyx'); assert.ok(h.ids().includes('helyx'));
  assert.doesNotMatch(h.get('[data-provider-grid]').innerHTML,/id="panel-disabled" hidden/);
  h.search('');
  h.emit('click',h.target('[data-quick-filter]',{quickFilter:'install'}));
  assert.deepEqual(h.ids(),['utim','qoder','zcode','freepi','omnirush']);
  h.emit('click',h.target('[data-quick-filter]',{quickFilter:'install'}));
  const sort=h.target('[data-sort-select]');sort.value='name';h.emit('change',sort);
  assert.deepEqual(h.ids().slice(0,4),['pixrouter','agentrouter','tokenforge','artbloom']);
  h.change('status','off');h.change('status','review');
  assert.equal(Number(h.get('[data-results-count]').textContent),24);
});

test('all card and modal actions retain exact destinations; archived actions are disabled', () => {
  const h=harness(),A=h.context.window.Adapters;
  for(const p of A.providers) {
    const card=h.context.window.Views.cardMarkup(p);
    h.context.window.Views.openProvider(p.id);
    const actions=h.get('.prov-act').innerHTML;
    assert.ok(actions.includes('href="'+A.esc(A.docsUrl(p))+'"'),p.id+' docs');
    if(p.status==='off'||!p.url) {
      assert.match(actions,/aria-disabled="true"/);
      assert.doesNotMatch(actions,/class="prov-signin"/);
    } else {
      assert.ok(card.includes('href="'+A.esc(p.url)+'"'),p.id+' card');
      assert.ok(actions.includes('href="'+A.esc(p.url)+'"'),p.id+' modal');
      assert.match(actions,/data-track-provider=/);
    }
    h.context.window.Views.closeModal();
  }
});

test('CSS parses and dynamic category controls expose native navigation and disclosure semantics', () => {
  const postcss=require('postcss');postcss.parse(source('css/directory.css'));
  const h=harness(),markup=h.get('[data-provider-grid]').innerHTML;
  assert.match(markup,/aria-label="Provider categories"/);
  assert.match(markup,/href="#category-installed"/);
  assert.match(markup,/aria-expanded="false" aria-controls="panel-disabled"/);
  assert.match(markup,/data-new-strip tabindex="0" role="region"/);
  assert.match(source('setup.html'),/npm install -g @emend-ai\/utim/);
  assert.match(source('setup.html'),/npx free-pi-cli@latest/);
  assert.doesNotMatch(source('setup.html'),/New accounts receive free API credits automatically/);
});

test('anonymous analytics allowlists properties and respects privacy preferences', () => {
  const h=harness(),sent=[];
  h.context.location.origin='https://example.com';
  h.context.fetch=(url,options)=>{sent.push({url,...options});return Promise.resolve();};
  vm.runInContext(source('js/analytics.js'),h.context);
  const track=h.context.window.DirectoryAnalytics.track;
  h.context.window.DIRECTORY_ANALYTICS={endpoint:''};
  track('provider_click',{providerId:'aetherai',action:'signup',placement:'new'});assert.equal(sent.length,0);
  h.context.window.DIRECTORY_ANALYTICS={endpoint:'/api/events'};
  track('provider_click',{providerId:'aetherai',action:'signup',placement:'new',url:'secret',query:'secret',referral:'secret'});
  assert.equal(sent.length,1);
  assert.equal(sent[0].credentials,'omit');assert.equal(sent[0].referrerPolicy,'no-referrer');
  assert.deepEqual(Object.keys(JSON.parse(sent[0].body).properties).sort(),['action','category','orderVersion','placement','providerId']);
  assert.doesNotMatch(sent[0].body,/secret|XfVv/);
  h.context.navigator.doNotTrack='1';track('filter_toggle',{key:'install',active:true});assert.equal(sent.length,1);
});

test('fresh visit opens notice after rendering directory and locks background including skip link', () => {
  const h = harness(null, { fresh: true });
  assert.equal(h.get('[data-community-modal]').hidden, false);
  assert.equal(h.get('[data-community-open]').hidden, false);
  assert.equal(h.document.activeElement, h.get('[data-community-title]'));
  assert.equal(h.get('[data-directory-shell]').inert, true);
  assert.equal(h.get('.skip-link').inert, true);
  assert.equal(h.document.body.classList.contains('modal-open'), true);
  assert.equal(h.context.window.Adapters.canonical.length,73); assert.ok(h.ids().includes('pixrouter'));
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
    h.context.window.Views.state.expanded.add('gateways'); h.context.window.Views.renderGrid();
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
  assert.equal(h.context.window.Adapters.canonical.length,73); assert.ok(h.ids().includes('pixrouter'));
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
