/* Setup guides page — behaviour only. All guide copy lives in setup.html.
   Loaded with a plain <script>; no modules, no build step. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const providers = window.PROVIDERS || [];

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  };
  refreshIcons();
  window.setTimeout(() => document.body.classList.add('is-ready'), 280);

  /* mobile navigation */
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

  /* copy buttons */
  const fallbackCopy = text => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  };
  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const block = button.closest('[data-code-block]');
    const text = $('pre', block)?.innerText || '';
    let copied = false;
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = fallbackCopy(text);
    }
    if (copied) {
      const original = button.innerHTML;
      button.innerHTML = '<i data-lucide="check"></i><span>Copied!</span>';
      refreshIcons();
      setTimeout(() => { button.innerHTML = original; refreshIcons(); }, 2000);
    } else {
      const label = button.querySelector('span');
      if (label) label.textContent = 'Select manually';
    }
  }));

  /* reading progress (this page is still a long document) */
  const progressBar = $('[data-progress-bar]');
  const progressValue = $('[data-progress-value]');
  const updateProgress = () => {
    if (!progressBar || !progressValue) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
    progressBar.style.width = `${value}%`;
    progressValue.textContent = `${value}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* sidebar highlight */
  const sectionLinks = $$('.side-nav a');
  const sections = $$('.section-anchor');
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }), { rootMargin: '-18% 0px -68% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  /* provider example tabs: strip is generated from the same data file as the list,
     so names, New API chips and offline states can never drift from it. */
  const byName = (a, b) => a.name.replace(/\s+AI$/i, '').localeCompare(b.name.replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' });
  $$('[data-tabs]').forEach(shell => {
    const strip = $('[data-tab-strip]', shell);
    const panels = $$('[data-panel]', shell);
    const panelIds = new Set(panels.map(panel => panel.dataset.panel));
    const ordered = providers.filter(p => panelIds.has(p.id)).sort((a, b) => {
      const off = p => (p.status === 'off' ? 1 : 0);
      return off(a) - off(b) || byName(a, b);
    });
    const firstLive = ordered.find(p => p.status !== 'off');
    if (strip) {
      strip.innerHTML = ordered.map(p => {
        const off = p.status === 'off';
        const active = p === firstLive;
        return `<button class="tab${active ? ' active' : ''}" type="button" role="tab" aria-selected="${active}" data-tab="${p.id}"${off ? ' disabled' : ''}>${p.name}${p.flags.includes('newapi') ? ' <span class="newapi-chip">New API</span>' : ''}${off ? ' <span class="off-badge">Unavailable</span>' : ''}</button>`;
      }).join('');
    }
    if (firstLive) panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === firstLive.id));
    $$('[data-tab]', shell).forEach(tab => tab.addEventListener('click', () => {
      $$('[data-tab]', shell).forEach(item => {
        item.classList.toggle('active', item === tab);
        item.setAttribute('aria-selected', String(item === tab));
      });
      panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab));
    }));
  });

  /* deep link from the list (#agentrouter etc.): select that provider's tab */
  const jump = () => {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const panel = $(`[data-panel="${CSS.escape ? CSS.escape(id) : id}"]`);
    const tab = $(`[data-tab="${id}"]`);
    if (panel && tab && !tab.disabled) tab.click();
  };
  jump();
  window.addEventListener('hashchange', jump);
})();
