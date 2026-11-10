const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Use a real HTML DOM without browser automation. Set JSDOM_PATH when the
// optional jsdom package is installed outside this repository.
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const html = fs.readFileSync(path.join(__dirname, '../agentcall/index.html'), 'utf8');

function setup({ reduced = false, loading = false } = {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.com/agentcall/' });
  const { window } = dom;
  const { document } = window;
  const callbacks = new Map();
  let tick = 0;
  const scrolls = [];
  // jsdom does not yet reflect HTMLElement.inert. Model that browser API.
  Object.defineProperty(window.HTMLElement.prototype, 'inert', {
    get() { return this.hasAttribute('inert'); },
    set(value) { this.toggleAttribute('inert', Boolean(value)); }
  });
  window.matchMedia = () => ({ matches: reduced });
  window.setTimeout = callback => { callbacks.set(++tick, callback); return tick; };
  window.clearTimeout = id => callbacks.delete(id);
  window.scrollTo = options => scrolls.push(options);
  Object.defineProperty(window, 'scrollY', { value: 128 });
  Object.defineProperty(window, 'scrollX', { value: 0 });
  Object.defineProperty(document.documentElement, 'clientWidth', { value: 1000 });
  Object.defineProperty(document, 'readyState', { value: loading ? 'loading' : 'complete' });
  window.HTMLElement.prototype.getClientRects = function () {
    return this.closest('[hidden], [inert]') ? [] : [{ width: 100, height: 44 }];
  };
  document.body.style.color = 'red';
  document.documentElement.style.scrollBehavior = 'smooth';
  const initialBodyStyle = document.body.getAttribute('style');
  const initialHtmlStyle = document.documentElement.getAttribute('style');
  const opener = document.querySelector('.skip-link');
  opener.focus();
  const existingInert = document.querySelector('footer');
  existingInert.inert = true;
  const script = document.getElementById('agentcall-announcement-script').textContent;
  window.eval(script);
  const overlay = document.getElementById('ac-announcement');
  const dialog = document.getElementById('ac-announcement-dialog');
  const next = document.getElementById('ac-announcement-next');
  const flush = () => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach(callback => callback());
  };
  const key = (value, shiftKey = false) => {
    const event = new window.KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    return event;
  };
  return { dom, window, document, overlay, dialog, next, opener, existingInert,
    flush, key, scrolls, initialBodyStyle, initialHtmlStyle, callbacks };
}

test('initial trigger waits for DOM readiness and opens once per page load', () => {
  const a = setup({ loading: true });
  assert.equal(a.overlay.hidden, true);
  a.document.dispatchEvent(new a.window.Event('DOMContentLoaded'));
  assert.equal(a.overlay.hidden, false);
  assert.equal(a.document.activeElement, a.dialog);
  assert.equal(a.document.body.style.position, 'fixed');
  assert.equal(a.document.querySelector('main').inert, true);
  const b = setup();
  assert.equal(b.overlay.hidden, false);
  a.dom.window.close(); b.dom.window.close();
});

test('primary action transitions once and updates dialog accessibility names', () => {
  const a = setup();
  a.next.click(); a.next.click();
  assert.equal(a.callbacks.size, 1);
  assert.equal(a.document.getElementById('ac-announcement-content').classList.contains('is-changing'), true);
  a.flush();
  const steps = a.overlay.querySelectorAll('[data-ac-step]');
  assert.equal(steps[0].hidden, true);
  assert.equal(steps[0].inert, true);
  assert.equal(steps[1].hidden, false);
  assert.equal(steps[1].inert, false);
  assert.equal(a.dialog.getAttribute('aria-labelledby'), 'ac-integration-title');
  assert.equal(a.dialog.getAttribute('aria-describedby'), 'ac-integration-description');
  assert.equal(a.document.activeElement.id, 'ac-integration-title');
  assert.equal(a.overlay.querySelector('[data-ac-step="integration"] a.ac-announcement__primary').href, 'https://app.agentcall.dev/login');
  a.dom.window.close();
});

test('keyboard traversal wraps in both directions and excludes the hidden step', () => {
  const a = setup();
  assert.equal(a.key('Tab').defaultPrevented, true);
  assert.equal(a.document.activeElement, a.overlay.querySelector('[data-ac-close]'));
  a.key('Tab', true);
  assert.match(a.document.activeElement.href, /github\.com/);
  a.key('Tab');
  assert.equal(a.document.activeElement, a.overlay.querySelector('[data-ac-close]'));
  a.next.click(); a.flush();
  a.key('Tab', true);
  assert.equal(a.document.activeElement.textContent, 'Continue exploring');
  a.opener.focus();
  assert.equal(a.document.activeElement, a.dialog);
  a.dom.window.close();
});

test('Escape during a transition cancels it and restores focus, scroll, and page styles', () => {
  const a = setup();
  a.next.click();
  assert.equal(a.key('Escape').defaultPrevented, true);
  a.flush();
  assert.equal(a.overlay.hidden, true);
  assert.equal(a.document.querySelector('[data-ac-step="integration"]').hidden, true);
  assert.equal(a.document.body.getAttribute('style'), a.initialBodyStyle);
  assert.equal(a.document.documentElement.getAttribute('style'), a.initialHtmlStyle);
  assert.equal(a.document.querySelector('main').inert, false);
  assert.equal(a.existingInert.inert, true);
  assert.equal(a.document.activeElement, a.opener);
  assert.deepEqual({ ...a.scrolls[0] }, { left: 0, top: 128, behavior: 'instant' });
  a.dom.window.close();
});

test('X and second-step dismissal work with reduced motion and no timers', () => {
  for (const integration of [false, true]) {
    const a = setup({ reduced: true });
    if (integration) a.next.click();
    const button = integration
      ? a.overlay.querySelector('[data-ac-step="integration"] [data-ac-close]')
      : a.overlay.querySelector('[data-ac-close]');
    button.click();
    assert.equal(a.overlay.hidden, true);
    assert.equal(a.callbacks.size, 0);
    a.dom.window.close();
  }
});

test('backdrop dismisses; content clicks and drags ending outside do not dismiss', () => {
  const a = setup();
  a.dialog.dispatchEvent(new a.window.Event('pointerdown', { bubbles: true }));
  a.overlay.click();
  assert.equal(a.overlay.classList.contains('is-open'), true);
  a.dialog.click();
  assert.equal(a.overlay.classList.contains('is-open'), true);
  a.overlay.dispatchEvent(new a.window.Event('pointerdown', { bubbles: true }));
  a.overlay.click(); a.flush();
  assert.equal(a.overlay.hidden, true);
  a.dom.window.close();
});

test('source scripts parse, local assets resolve, and exported file contains no extension DOM', () => {
  const dom = new JSDOM(html);
  for (const script of dom.window.document.querySelectorAll('script:not([src]):not([type="application/ld+json"])')) {
    assert.doesNotThrow(() => new vm.Script(script.textContent));
  }
  for (const node of dom.window.document.querySelectorAll('[src], link[href]')) {
    const reference = node.getAttribute('src') || node.getAttribute('href');
    if (reference.startsWith('./')) assert.ok(fs.existsSync(path.join(__dirname, '../agentcall', reference)), reference);
  }
  assert.doesNotMatch(html, /PING_CONTENT_PUSH_NOTIFICATION|data-gr-ext-installed|sider-code-explain/);
  dom.window.close();
});
