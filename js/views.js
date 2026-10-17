/* views — renders the 5 shell views + right column, and owns the drawer +
   bookmark store. Rendering is delegated; app.js keeps the provider list. */
(() => {
  const A = window.Adapters;
  const esc = A.esc;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...document.querySelectorAll(selector)];

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  };

  /* ---------------- bookmarks (this browser only) ---------------- */
  const SAVED_KEY = 'aip2026.saved.v1';
  let savedIds = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      if (Array.isArray(raw)) return new Set(raw.filter(id => A.providers.some(p => p.id === id)));
    } catch {}
    return new Set();
  })();
  const persistSaved = () => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds])); } catch {}
  };
  const notify = message => {
    const toast = $('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  };
  const toggleSave = id => {
    if (!A.providers.some(p => p.id === id)) return;
    if (savedIds.has(id)) savedIds.delete(id); else savedIds.add(id);
    persistSaved();
    $$(`[data-save="${id}"]`).forEach(button => {
      const on = savedIds.has(id);
      button.setAttribute('aria-pressed', String(on));
      button.innerHTML = `<i data-lucide="${on ? 'bookmark-check' : 'bookmark'}"></i>${on ? 'Saved' : 'Save'}`;
    });
    renderSavedViews();
    const p = A.providers.find(x => x.id === id);
    if (p) notify(savedIds.has(id) ? `Saved ${p.name}.` : `Removed ${p.name} from saved.`);
    refreshIcons();
  };

  /* ---------------- rings ---------------- */
  const RING_C = 2 * Math.PI * 15.5;
  const ring = pct => `
    <span class="ring"><svg width="36" height="36" viewBox="0 0 36 36" role="img"
      aria-label="Documentation completeness ${pct} percent">
      <circle class="track" cx="18" cy="18" r="15.5" stroke-width="3"/>
      <circle class="fill" cx="18" cy="18" r="15.5" stroke-width="3"
        stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${(RING_C * (1 - pct / 100)).toFixed(1)}"/>
    </svg></span>`;

  /* ---------------- dashboard featured cards ---------------- */
  const PALETTE = ['', 'v--violet', 'v--amber', 'v--coral'];
  function renderFeatured() {
    const grid = $('[data-featured-grid]');
    if (!grid) return;
    grid.innerHTML = A.featured.map((p, index) => {
      const off = A.isOff(p);
      const score = A.docScore(p);
      const models = (p.models || []);
      const badge = models.length
        ? `<b>${models.length}</b><span>models</span>`
        : '<b>—</b><span>models</span>';
      const saveState = savedIds.has(p.id);
      const open = off
        ? '<span class="api-btn" aria-disabled="true" title="This provider is offline">Unavailable <i data-lucide="circle-off"></i></span>'
        : `<a class="api-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Get API <i data-lucide="arrow-up-right"></i></a>`;
      return `<li class="api-card ${PALETTE[index % PALETTE.length]}${off ? ' is-off' : ''}">
        <h3 class="api-title">${esc(p.name)}${A.isNew(p) ? '<span class="api-chip">new</span>' : ''}</h3>
        <p class="api-desc" title="${esc(p.blurb)}">${esc(p.blurb)}</p>
        <div class="api-meter-label"><span>Docs complete</span><span>${score}%</span></div>
        <div class="api-meter" role="progressbar" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"
          aria-label="Documentation completeness for ${esc(p.name)}"><i style="--w:${score}"></i></div>
        <div class="api-actions">
          ${open}
          <button type="button" class="api-btn ghost" data-save="${esc(p.id)}" aria-pressed="${saveState}">
            <i data-lucide="${saveState ? 'bookmark-check' : 'bookmark'}"></i>${saveState ? 'Saved' : 'Save'}
          </button>
        </div>
        <span class="api-badge" aria-hidden="true">${badge}</span>
      </li>`;
    }).join('');
  }

  /* live badge counts across ALL providers */
  const countLive = pred => A.providers.filter(p => !A.isOff(p) && pred(p)).length;
  function renderFacts() {
    const total = A.providers.length;
    const live = total - A.providers.filter(A.isOff).length;
    const tracked = $('[data-tracked-count]');
    if (tracked) tracked.textContent = `${live} of ${total} providers live`;
    $$('[data-view-lede-count]').forEach(el => { el.textContent = `${live}/${total} live`; });
  }

  /* ---------------- categories ---------------- */
  function renderCategories() {
    const grid = $('[data-cat-grid]');
    if (!grid) return;
    grid.innerHTML = A.CATEGORIES.map(cat => `
      <li>
        <button type="button" class="cat-tile" data-cat-tile="${cat.id}"
          data-facet-id="${cat.countFacet || ''}" data-facet-query="${cat.countQuery || ''}">
          <span class="cico"><i data-lucide="${cat.icon}"></i></span>
          ${esc(cat.label)}
          <span>${A.catCount(cat)}</span>
        </button>
      </li>`).join('');
  }

  /* ---------------- tools & SDKs ---------------- */
  function renderTools() {
    const grid = $('[data-tool-grid]');
    if (!grid) return;
    const tools = [
      { icon: 'bot-message-square', name: 'Claude Code setup', note: 'Point Claude Code at any anthropic-route gateway with placeholders only.' },
      { icon: 'square-terminal', name: 'Codex CLI setup', note: 'Wire an openai-route gateway into Codex CLI using config placeholders.' },
      { icon: 'toggle-left', name: 'CC Switch profiles', note: 'Switch coding clients between gateways without exposing keys in plain files.' }
    ];
    grid.innerHTML = tools.map(tool => `
      <li><a class="tool-card" href="setup.html" aria-label="${esc(tool.name)} — open guide">
        <span class="cico"><i data-lucide="${tool.icon}"></i></span>
        <span><b>${esc(tool.name)}</b><p>${esc(tool.note)}</p></span>
      </a></li>`).join('') + `
      <li><a class="tool-card" href="https://github.com/TsmHabib03/NEW-FREE-API-PROVIDERS-2026/issues/new?title=%5BAPI+submission%5D"
        target="_blank" rel="noopener noreferrer">
        <span class="cico"><i data-lucide="plus"></i></span>
        <span><b>Submit an API</b><p>Propose a gateway in the public tracker — verified end-to-end before listing.</p></span>
      </a></li>`;
  }

  /* ---------------- saved views ---------------- */
  function renderSavedViews() {
    const grid = $('[data-saved-grid]');
    const empty = $('[data-saved-empty]');
    const mini = $('[data-saved-mini]');
    const items = [...savedIds].map(id => A.providers.find(p => p.id === id)).filter(Boolean);

    if (empty) empty.hidden = items.length > 0;
    if (grid) {
      grid.innerHTML = items.map(p => {
        const score = A.docScore(p);
        return `<li class="saved-card">
          <div class="stop">
            <img src="${esc(A.logo(p))}" alt="" loading="lazy">
            <span><span class="sname">${esc(p.name)}${A.isNew(p) ? ' <code class="api-chip" style="background:var(--accent-soft);color:var(--accent)">new</code>' : ''}</span>
            <span class="ssub">${esc(p.blurb)}</span></span>
            <button type="button" class="sremove" data-save-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from saved"><i data-lucide="bookmark-x"></i></button>
          </div>
          <div class="slabel"><span>Docs complete</span><span>${score}%</span></div>
          <div class="smeter"><i style="--w:${score}"></i></div>
          <div class="slinks">
            ${A.isOff(p)
              ? '<span class="api-btn" style="background:var(--surface);color:var(--faint)" aria-disabled="true">Unavailable <i data-lucide="circle-off"></i></span>'
              : `<a class="api-btn" style="background:var(--surface);color:var(--ink)" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open <i data-lucide="arrow-up-right"></i></a>`}
          </div>
        </li>`;
      }).join('');
    }
    if (mini) {
      if (!items.length) {
        mini.innerHTML = '<p class="saved-empty">Nothing saved yet — tap “Save” on a provider card and it will appear here.</p>';
      } else {
        mini.innerHTML = items.slice(0, 5).map(p => {
          const score = A.docScore(p);
          const live = !A.isOff(p);
          return `<div class="saved-item">
            <img src="${esc(A.logo(p))}" alt="" loading="lazy">
            <span><span class="sname">${esc(p.name)}</span><span class="ssub">${live ? A.kindLabel(p) || 'provider' : 'offline'}</span></span>
            <span class="score">${ring(score)}<span style="font:700 12px var(--font-mono);color:var(--ink-dim)">${score}%</span></span>
          </div>`;
        }).join('') + (items.length > 5 ? `<p class="saved-empty" style="margin-top:8px">+${items.length - 5} more in the Saved tab</p>` : '');
      }
    }
  }

  /* ---------------- coverage ---------------- */
  function renderCoverage() {
    const wrap = $('[data-coverage]');
    if (!wrap) return;
    wrap.innerHTML = A.COVERAGE.map(row => `
      <button type="button" class="cover-row" data-coverage
        data-facet-id="${row.go.facet || ''}" data-facet-query="${row.go.query ?? ''}"
        title="Show filtered list in Providers">
        <span class="cico"><i data-lucide="${row.icon}"></i></span>
        ${esc(row.label)}
        <span>${row.count}</span>
      </button>`).join('');
  }

  /* ---------------- drawer ---------------- */
  const menu = () => ({
    sidebar: $('[data-sidebar]'),
    veil: $('[data-veil]'),
    burger: $('[data-burger]')
  });
  function setDrawer(open) {
    const { sidebar, veil, burger } = menu();
    if (!sidebar) return;
    sidebar.classList.toggle('open', open);
    if (veil) veil.hidden = !open;
    if (burger) burger.setAttribute('aria-expanded', String(open));
    burger instanceof HTMLElement && (burger.innerHTML = `<i data-lucide="${open ? 'x' : 'menu'}"></i>`);
    refreshIcons();
  }
  function wireDrawer() {
    const { sidebar, veil, burger } = menu();
    burger?.addEventListener('click', () => setDrawer(!sidebar.classList.contains('open')));
    veil?.addEventListener('click', () => setDrawer(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && sidebar?.classList.contains('open')) setDrawer(false);
    });
  }

  /* ---------------- global click delegation ---------------- */
  function wireClicks() {
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-nav]');
      if (nav && window.AipRouter) { window.AipRouter.show(nav.dataset.nav); if (window.innerWidth <= 1023) setDrawer(false); return; }

      const goto = event.target.closest('[data-goto]');
      if (goto && window.AipRouter) { window.AipRouter.show(goto.dataset.goto); return; }

      const tile = event.target.closest('[data-cat-tile],[data-coverage]');
      if (tile) {
        const facet = tile.dataset.facetId;
        const query = tile.dataset.facetQuery;
        if (window.aipList) {
          window.aipList.setFacet(facet || 'all');
          if (query) window.aipList.setQuery(query);
        else if (window.aipList.setQuery) window.aipList.setQuery('');
        }
        if (window.AipRouter) window.AipRouter.show('providers');
        return;
      }

      const save = event.target.closest('[data-save]');
      if (save) { toggleSave(save.dataset.save); return; }

      const remove = event.target.closest('[data-save-remove]');
      if (remove) { toggleSave(remove.dataset.saveRemove); return; }
    });
  }

  window.Views = { renderAll };
  function renderAll() {
    renderFeatured();
    renderFacts();
    renderCategories();
    renderTools();
    renderSavedViews();
    renderCoverage();
    refreshIcons();
  }

  wireDrawer();
  wireClicks();
  renderAll();
})();
