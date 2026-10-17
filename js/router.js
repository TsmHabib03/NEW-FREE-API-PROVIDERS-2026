/* router — hash-based view switching for the hub. The hub has a single view
   ("providers"); the router is kept so the nav link and deep-link keep working. */
(() => {
  const VIEWS = ['providers'];
  const sections = () => [...document.querySelectorAll('[data-view]')];
  const navs = () => [...document.querySelectorAll('[data-nav]')];

  const TITLES = { providers: 'Free AI API providers | API Hub 2026' };

  function show(id, options = {}) {
    if (!VIEWS.includes(id)) id = 'providers';
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
      history.replaceState(history.state, '', `#${id}`);
    }
    document.title = TITLES[id] || TITLES.providers;
  }

  function fromHash() {
    const id = location.hash.replace(/^#\/?/, '');
    show(VIEWS.includes(id) ? id : 'providers');
  }

  window.addEventListener('hashchange', fromHash);
  window.AipRouter = { show, current: () => location.hash.replace(/^#\/?/, '') || 'providers' };
  fromHash();
})();
