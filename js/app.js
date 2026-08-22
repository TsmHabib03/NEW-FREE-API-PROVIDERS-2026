(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  };
  refreshIcons();
  window.setTimeout(() => document.body.classList.add('is-ready'), 280);

  const menuToggle = $('[data-menu-toggle]');
  const mobilePanel = $('[data-mobile-panel]');
  menuToggle?.addEventListener('click', () => {
    const open = mobilePanel.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    refreshIcons();
  });
  $$('[data-mobile-panel] a').forEach(link => link.addEventListener('click', () => {
    mobilePanel.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    refreshIcons();
  }));

  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const block = button.closest('[data-code-block]');
    const text = $('pre', block)?.innerText || '';
    try {
      await navigator.clipboard.writeText(text);
      const original = button.innerHTML;
      button.innerHTML = '<i data-lucide="check"></i><span>Copied!</span>';
      refreshIcons();
      setTimeout(() => { button.innerHTML = original; refreshIcons(); }, 2000);
    } catch {
      button.querySelector('span').textContent = 'Select manually';
    }
  }));

  $$('[data-tabs]').forEach(tabShell => {
    const tabs = $$('[data-tab]', tabShell);
    const panels = $$('[data-panel]', tabShell);
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const key = tab.dataset.tab;
      tabs.forEach(item => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
      panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === key));
    }));
  });

  const progressBar = $('[data-progress-bar]');
  const progressValue = $('[data-progress-value]');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
    progressBar.style.width = `${value}%`;
    progressValue.textContent = `${value}%`;
    try { localStorage.setItem('ai-credits-progress', String(value)); } catch {}
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const sectionLinks = $$('.side-nav a');
  const sections = $$('.section-anchor');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  }), { rootMargin: '-18% 0px -68% 0px' });
  sections.forEach(section => observer.observe(section));

  const overlay = $('[data-search-overlay]');
  const input = $('[data-search-input]');
  const results = $('[data-search-results]');
  const searchable = $$('[data-searchable]');
  const closeSearch = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); };
  const openSearch = () => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); input.value = ''; renderResults(''); setTimeout(() => input.focus(), 0); };
  const renderResults = query => {
    const normalized = query.trim().toLowerCase();
    const matches = searchable.filter(section => !normalized || section.innerText.toLowerCase().includes(normalized));
    results.innerHTML = matches.slice(0, 12).map(section => `<a class="search-result" href="#${section.id}"><strong>${$('h2', section)?.textContent || section.id}</strong><span>${($('p', section)?.textContent || '').slice(0, 110)}</span></a>`).join('') || '<div class="search-result"><strong>No matching sections</strong><span>Try Claude, Codex, API key, model, or 401.</span></div>';
    $$('.search-result', results).forEach(result => result.addEventListener('click', closeSearch));
  };
  $('[data-search-open]')?.addEventListener('click', openSearch);
  $('[data-search-close]')?.addEventListener('click', closeSearch);
  input?.addEventListener('input', event => renderResults(event.target.value));
  overlay?.addEventListener('click', event => { if (event.target === overlay) closeSearch(); });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') closeSearch();
  });
})();
