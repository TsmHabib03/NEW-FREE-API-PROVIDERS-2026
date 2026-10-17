/* theme — light (default) ⇄ dark, persisted to localStorage, no FOUC because
   index.html applies the saved theme in a pre-paint inline script. */
(() => {
  const root = document.documentElement;
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function paint() {
    const light = root.dataset.theme === 'light';
    const label = light ? 'Dark mode' : 'Light mode';
    const icon = light ? 'moon' : 'sun';
    $$('[data-theme-toggle]').forEach(button => {
      const hasText = button.querySelector('[data-theme-label]');
      button.setAttribute('aria-pressed', String(light));
      button.setAttribute('aria-label', `Switch to ${label}`);
      button.title = `${label} (T)`;
      button.innerHTML = hasText
        ? `<i data-lucide="${icon}"></i><span data-theme-label>${label}</span>`
        : `<i data-lucide="${icon}"></i>`;
    });
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute('content', light ? '#eef1f7' : '#070b14');
    });
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  }

  try {
    /* first visit with no stored preference: default to light */
    if (!localStorage.getItem('aip2026.theme')) root.dataset.theme = 'light';
  } catch {}

  function toggle() {
    const light = root.dataset.theme !== 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    try { localStorage.setItem('aip2026.theme', light ? 'light' : 'dark'); } catch {}
    paint();
  }

  [...document.querySelectorAll('[data-theme-toggle]')].forEach(button =>
    button.addEventListener('click', event => { event.preventDefault(); toggle(); }));

  document.addEventListener('keydown', event => {
    const target = event.target;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 't' || event.key === 'T') { event.preventDefault(); toggle(); }
  });

  paint();
})();
