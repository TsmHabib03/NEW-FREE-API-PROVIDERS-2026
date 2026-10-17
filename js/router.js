/* router — hash-based view switching for the shell. Errors recorded as
   comments only; no extra DOM elements are allowed to be injected. */
(() => {
  const VIEWS = ['dashboard', 'providers', 'categories', 'tools', 'saved'];
  const sections = () => [...document.querySelectorAll('[data-view]')];
  const navs = () => [...document.querySelectorAll('[data-nav]')];

  function show(id, options = {}) {
    if (!VIEWS.includes(id)) id = 'dashboard';
    sections().forEach(section => {
      const active = section.dataset.view === id;
      section.hidden = !active;
      if (active && !options.keepScroll) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0; /* plain old browsers too */
      }
    });
    navs().forEach(link => {
      const active = link.dataset.nav === id;
      link.classList.toggle('active', active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });
    /* keep the hash a plain string id without triggering scrolling */
    if (location.hash !== `#${id}`) {
      const previous = location.hash;
      const optionsBefore = history.state;
      history.replaceState(optionsBefore, '', `#${id}`);
      /* hashchange fired by the browser? no — replaceState does not fire it */
      void previous;
    }
    if (window.aipList && id === 'providers') window.aipList.renderDown?.();
    document.title = ({
      dashboard: 'Free AI API providers | API Hub 2026',
      providers: 'Providers | API Hub 2026',
      categories: 'Categories | API Hub 2026',
      tools: 'Tools & SDKs | API Hub 2026',
      saved: 'Saved providers | API Hub 2026'
    })[id];
  }

  function fromHash() {
    const id = location.hash.replace(/^#\//, '');
    show(VIEWS.includes(id) ? id : 'dashboard');
  }

  window.addEventListener('hashchange', fromHash);
  window.AipRouter = { show, current: () => location.hash.replace(/^#\//, '') || 'dashboard' };
  fromHash();
})();
