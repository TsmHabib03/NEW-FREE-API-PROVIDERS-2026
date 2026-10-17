/* Provider list — renders js/providers.js into the index.html list surface.
   No backend, no build step, no modules: this file is loaded with a plain <script>.
   Rules that must not be broken here:
     - nothing is invented: a missing field renders as an explicit "unknown"
     - offline providers stay visible, pinned last, never linked
     - referral URLs are used verbatim (they come straight from the data file) */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  };

  const esc = value => String(value == null ? '' : value)
    .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const providers = (window.PROVIDERS || []).slice();
  const byId = new Map(providers.map(p => [p.id, p]));

  /* ---------------- mobile navigation ---------------- */
  const menuToggle = $('[data-menu-toggle]');
  const mobilePanel = $('[data-mobile-panel]');
  const setMenu = open => {
    if (!menuToggle || !mobilePanel) return;
    mobilePanel.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    refreshIcons();
  };
  menuToggle?.addEventListener('click', event => {
    event.stopPropagation();
    setMenu(!mobilePanel.classList.contains('open'));
  });
  $$('[data-mobile-panel] a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  /* tapping the page behind the panel, or Escape, closes it — on touch there is no
     hover-out and no visible close button beyond the burger itself */
  document.addEventListener('click', event => {
    if (!mobilePanel?.classList.contains('open')) return;
    if (!event.target.closest('[data-mobile-panel]')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobilePanel?.classList.contains('open')) setMenu(false);
  });

  /* ---------------- derived facts ---------------- */
  const NEW_DAYS = 7;                        // short on purpose: 40 of 46 live rows date from
  const isNew = p => p.status === 'live'     // late Sep / early Oct 2026, so a 30-day window
    && !!p.addedAt                           // would badge ~85% of the list — the HOT mistake.
    && (Date.now() - new Date(`${p.addedAt}T00:00:00`).getTime()) / 864e5 <= NEW_DAYS;
  const isOff = p => p.status === 'off';
  const hasProto = (p, key) => (p.protocol || []).includes(key);
  const hasFlag = (p, flag) => (p.flags || []).includes(flag);
  const protoLabel = key => (key === 'anthropic' ? 'Anthropic' : key === 'openai' ? 'OpenAI' : key);
  const FREE_SHAPE = { 'signup-credit': 'signup credit', 'invite-bonus': 'invite bonus', 'free-tier': 'free tier' };

  const STORE = 'aip2026.list.v1';
  const hasRank = providers.some(p => typeof p.rank === 'number');

  function byName(a, b) {
    const clean = name => String(name).replace(/\s+AI$/i, '');
    return clean(a.name).localeCompare(clean(b.name), undefined, { sensitivity: 'base' });
  }
  const ORDER_LIVE = {
    recommended: (a, b) => ((a.rank ?? 1e9) - (b.rank ?? 1e9)) || byName(a, b),
    newest: (a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')) || byName(a, b),
    az: (a, b) => byName(a, b),
    newapi: (a, b) => (hasFlag(b, 'newapi') ? 1 : 0) - (hasFlag(a, 'newapi') ? 1 : 0) || byName(a, b)
  };
  const ORDER_LABELS = { recommended: 'Recommended', newest: 'Newest', az: 'A–Z', newapi: 'New API first' };

  const FACETS = [
    { id: 'all', label: 'All', test: () => true },
    { id: 'claude', label: 'Works with Claude Code', test: p => !isOff(p) && hasProto(p, 'anthropic') },
    { id: 'codex', label: 'Works with Codex', test: p => !isOff(p) && hasProto(p, 'openai') },
    { id: 'newapi', label: 'New API', test: p => !isOff(p) && hasFlag(p, 'newapi') },
    { id: 'nocard', label: 'No card needed', test: p => !isOff(p) && p.noCard === true },
    { id: 'guide', label: 'Has setup guide', test: p => !isOff(p) && !!p.guide },
    { id: 'off', label: 'Unavailable', test: isOff }
  ];
  const DENSITIES = ['list', 'compact', 'cards'];

  const state = {
    q: '',
    facet: 'all',
    order: hasRank ? 'recommended' : 'newest',
    density: 'list',
    cmp: []
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (typeof saved.q === 'string') state.q = saved.q;
    if (FACETS.some(f => f.id === saved.facet)) state.facet = saved.facet;
    if (ORDER_LIVE[saved.order] && (saved.order !== 'recommended' || hasRank)) state.order = saved.order;
    if (DENSITIES.includes(saved.density)) state.density = saved.density;
  } catch {}

  /* ---------------- element handles ---------------- */
  const list = $('[data-provider-list]');
  const search = $('[data-list-search]');
  const facetRow = $('[data-facets]');
  const orderSelect = $('[data-order]');
  const densityBtns = $$('[data-density]');
  const countEl = $('[data-list-count]');
  const emptyEl = $('[data-list-empty]');
  const clearBtn = $('[data-clear-search]');
  const toast = $('[data-toast]');
  const cmpBar = $('[data-cmp-bar]');
  const cmpChips = $('[data-cmp-chips]');
  const cmpCount = $('[data-cmp-count]');
  const cmpSheet = $('[data-cmp-sheet]');
  const cmpTable = $('[data-cmp-table]');
  if (!list) return;

  const persist = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ q: state.q, facet: state.facet, order: state.order, density: state.density })); } catch {}
  };

  /* ---------------- controls built once ---------------- */
  orderSelect.innerHTML = Object.keys(ORDER_LIVE)
    .filter(key => key !== 'recommended' || hasRank)
    .map(key => `<option value="${key}">${ORDER_LABELS[key]}</option>`)
    .join('');
  orderSelect.value = state.order;

  facetRow.innerHTML = FACETS.map(facet =>
    `<button type="button" class="filter-chip${facet.id === state.facet ? ' active' : ''}" data-facet="${facet.id}" aria-pressed="${facet.id === state.facet}">${esc(facet.label)}<span class="chip-count" data-facet-count="${facet.id}"></span></button>`
  ).join('');

  /* ---------------- markup ---------------- */
  const modelChips = (p, max) => {
    const models = p.models || [];
    if (models.length) {
      const shown = models.slice(0, max).map(m => `<code class="model-chip">${esc(m)}</code>`).join('');
      const rest = models.length > max ? `<code class="model-chip model-more">+${models.length - max} more</code>` : '';
      return shown + rest;
    }
    if (p.modelsNote) return `<code class="model-chip model-more">${esc(p.modelsNote)}</code>`;
    return '<code class="model-chip model-more">models unknown</code>';
  };
  const facetText = p => {
    const bits = (p.protocol || []).map(protoLabel);
    if (!bits.length) bits.push('client route unknown');
    if (FREE_SHAPE[p.freeShape]) bits.push(FREE_SHAPE[p.freeShape]);
    if (p.inviteOnly) bits.push('invite only');
    if (p.noCard) bits.push('no card');
    if (p.guide) bits.push('setup guide');
    return bits.join(' · ');
  };
  const ctaMarkup = p => isOff(p)
    ? '<span class="prow-cta is-off">Unavailable <i data-lucide="ban"></i></span>'
    : '<span class="prow-cta">Open sign-up <i data-lucide="arrow-up-right"></i></span>';
  const rowBody = p => `
        <span class="prow-logo"><img src="${esc(p.logo)}" alt="" loading="lazy"></span>
        <span class="prow-main">
          <span class="prow-top">
            <span class="prow-name">${esc(p.name)}</span>
            <span class="prow-status${isOff(p) ? ' is-off' : ''}"><span class="prow-dot" aria-hidden="true"></span>${isOff(p) ? 'offline' : 'live'}</span>
            ${hasFlag(p, 'newapi') ? '<span class="newapi-chip">New API</span>' : ''}${isNew(p) ? '<span class="new-badge">New</span>' : ''}
          </span>
          <span class="prow-sub">
            <span class="prow-models">${modelChips(p, 4)}</span>
            <span class="prow-facets">${esc(facetText(p))}</span>
          </span>
        </span>
        ${ctaMarkup(p)}`;

  const rowMarkup = p => {
    const selected = state.cmp.includes(p.id);
    const pick = isOff(p) ? '' : `<button class="prow-pick" type="button" tabindex="-1" data-cmp-pick="${esc(p.id)}" aria-pressed="${selected}" aria-label="Compare ${esc(p.name)}" title="Add to compare (focus a row and press c)"><i data-lucide="${selected ? 'minus' : 'plus'}"></i></button>`;
    const guide = p.guide && !isOff(p)
      ? `<a class="prow-guide" href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer" aria-label="Setup guide for ${esc(p.name)}" title="Provider's own setup guide"><i data-lucide="book-open"></i></a>`
      : '';
    const body = isOff(p)
      ? `<span class="prow-link is-off" role="link" aria-disabled="true" title="${esc(p.blurb)}">${rowBody(p)}</span>`
      : `<a class="prow-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="${esc(p.blurb)}">${rowBody(p)}</a>`;
    return `<li class="prow${isOff(p) ? ' is-off' : ''}${selected ? ' is-picked' : ''}" data-id="${esc(p.id)}">${pick}${body}${guide}</li>`;
  };

  const cardMarkup = p => {
    const off = isOff(p);
    const primary = off
      ? '<span class="provider-link provider-button is-disabled" aria-disabled="true"><span>Sign-up disabled</span><i class="button-arrow" data-lucide="ban"></i></span>'
      : `<a class="provider-link provider-button" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span>Open sign-up link</span><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`;
    const guide = p.guide && !off
      ? `<a class="provider-link provider-guide" href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer"><i data-lucide="book-open"></i><span>Setup guide</span><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`
      : '';
    return `<li class="pcard-item"><article class="provider-card${off ? ' is-disabled' : ''}">
      <div class="provider-head">
        <span class="cta-icon"><img src="${esc(p.logo)}" alt="" loading="lazy"></span>
        <div class="provider-title">
          <h3>${esc(p.name)}${hasFlag(p, 'newapi') ? ' <span class="newapi-chip">New API</span>' : ''}${isNew(p) ? ' <span class="new-badge">New</span>' : ''}${off ? ' <span class="off-badge">Unavailable</span>' : ''}</h3>
          <span class="status${off ? ' status-off' : ''}"><span></span>${off ? 'Offline' : 'Live'}</span>
        </div>
      </div>
      <div class="model-row">${modelChips(p, 6)}</div>
      <p class="card-facets">${esc(facetText(p))}</p>
      <div class="provider-actions">${primary}${guide}</div>
    </article></li>`;
  };

  /* ---------------- filtering ---------------- */
  const matchesQuery = (p, q) => {
    if (!q) return true;
    const hay = [
      p.name, p.blurb, p.offer, p.kind, p.freeShape, p.addedAt,
      (p.models || []).join(' '), p.modelsNote || '',
      (p.protocol || []).join(' '), (p.flags || []).join(' '),
      p.guide ? 'setup guide' : ''
    ].join(' ').toLowerCase();
    return q.split(/\s+/).filter(Boolean).every(token => hay.includes(token));
  };
  const orderList = listOf => [
    ...listOf.filter(p => !isOff(p)).sort(ORDER_LIVE[state.order]),
    ...listOf.filter(isOff).sort(byName)
  ];

  /* ---------------- compare ---------------- */
  const flash = message => {
    if (!toast) return;
    /* lift the toast clear of the compare tray when it is up (the tray height
       changes when chips wrap on narrow screens, so measure it, don't assume) */
    if (cmpBar && !cmpBar.hidden) toast.style.bottom = `${cmpBar.offsetHeight + 14}px`;
    else toast.style.bottom = '';
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  };
  const pick = id => {
    const index = state.cmp.indexOf(id);
    if (index >= 0) state.cmp.splice(index, 1);
    else {
      if (state.cmp.length >= 4) { flash('Compare holds 4 providers — remove one first.'); return; }
      state.cmp.push(id);
    }
    render();
    renderCompare();
  };
  const CMP_ROWS = [
    ['Models', p => (p.models || []).length ? (p.models || []).map(m => `<code>${esc(m)}</code>`).join(' ') : `<em class="unknown">${p.modelsNote ? esc(p.modelsNote) : 'unknown'}</em>`],
    ['Client route', p => (p.protocol || []).length ? esc((p.protocol || []).map(protoLabel).join(' · ')) : '<em class="unknown">unknown</em>'],
    ['Kind', p => p.kind === 'unknown' ? '<em class="unknown">unknown</em>' : esc(String(p.kind).replace(/-/g, ' '))],
    ['Free shape', p => FREE_SHAPE[p.freeShape] ? esc(FREE_SHAPE[p.freeShape]) : '<em class="unknown">unknown</em>'],
    ['Card', p => p.noCard === true ? 'no card needed' : '<em class="unknown">not documented</em>'],
    ['Setup guide', p => p.guide ? `<a href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer">provider guide</a>` : '<em class="unknown">none</em>'],
    ['Added', p => esc(p.addedAt || 'unknown')],
    ['Sign-up', p => isOff(p) ? '<em class="unknown">unavailable</em>' : `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">open sign-up</a>`]
  ];
  /* keep the page clear of the fixed tray: its height changes as chips wrap on
     narrow screens, so mirror the measured height onto body padding (and re-lift
     a toast that is already showing) */
  const syncCmpPad = () => {
    if (!cmpBar) return;
    if (cmpBar.hidden) { document.body.style.paddingBottom = ''; return; }
    document.body.style.paddingBottom = `${cmpBar.offsetHeight}px`;
    if (toast && toast.classList.contains('show')) toast.style.bottom = `${cmpBar.offsetHeight + 14}px`;
  };
  const renderCompare = () => {
    const chosen = state.cmp.map(id => byId.get(id)).filter(Boolean);
    if (cmpBar) cmpBar.hidden = chosen.length === 0;
    document.body.classList.toggle('has-cmp', chosen.length > 0);
    if (chosen.length === 0 && cmpSheet && !cmpSheet.hidden) {
      cmpSheet.hidden = true;
      if (cmpTable) cmpTable.innerHTML = '';
    }
    if (cmpCount) cmpCount.textContent = String(chosen.length);
    if (cmpChips) {
      cmpChips.innerHTML = chosen.map(p => `<span class="cmp-chip">${esc(p.name)}<button type="button" data-cmp-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)}"><i data-lucide="x"></i></button></span>`).join('');
      $$('[data-cmp-remove]', cmpChips).forEach(button => button.addEventListener('click', () => pick(button.dataset.cmpRemove)));
    }
    if (cmpTable && cmpSheet && !cmpSheet.hidden && chosen.length) {
      cmpTable.innerHTML = `<table class="cmp-table">
        <caption>${chosen.length} provider${chosen.length > 1 ? 's' : ''} compared. “unknown” means the provider does not publish that detail.</caption>
        <thead><tr><th scope="col">Field</th>${chosen.map(p => `<th scope="col">${esc(p.name)}</th>`).join('')}</tr></thead>
        <tbody>${CMP_ROWS.map(([label, read]) => `<tr><th scope="row">${esc(label)}</th>${chosen.map(p => `<td>${read(p)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    }
    refreshIcons();
    syncCmpPad();
  };

  /* ---------------- render ---------------- */
  let rowLinks = [];
  const render = () => {
    const q = state.q.trim().toLowerCase();
    const facet = FACETS.find(f => f.id === state.facet) || FACETS[0];
    const searched = providers.filter(p => matchesQuery(p, q));
    const shown = orderList(searched.filter(facet.test));

    list.className = `plist${state.density === 'cards' ? ' is-cards' : state.density === 'compact' ? ' is-compact' : ''}`;
    list.innerHTML = state.density === 'cards' ? shown.map(cardMarkup).join('') : shown.map(rowMarkup).join('');

    FACETS.forEach(f => {
      const counter = $(`[data-facet-count="${f.id}"]`);
      if (counter) counter.textContent = String(searched.filter(f.test).length);
    });
    $$('[data-facet]', facetRow).forEach(chip => {
      const active = chip.dataset.facet === state.facet;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    /* In the mobile scroll strip the active chip can sit off-screen (a facet restored
       from localStorage, or a keyboard-driven change). Reveal it without moving the
       page: block:'nearest' keeps the vertical scroll position put. */
    const activeChip = $(`[data-facet="${state.facet}"]`, facetRow);
    if (activeChip && facetRow.scrollWidth > facetRow.clientWidth + 1) {
      const rowBox = facetRow.getBoundingClientRect();
      const chipBox = activeChip.getBoundingClientRect();
      if (chipBox.left < rowBox.left - 1 || chipBox.right > rowBox.right + 1) {
        activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }

    if (countEl) countEl.textContent = `${shown.length} of ${providers.length} providers shown`;
    if (emptyEl) emptyEl.hidden = shown.length > 0;
    if (clearBtn) clearBtn.classList.toggle('visible', state.q.length > 0);
    densityBtns.forEach(button => {
      const active = button.dataset.density === state.density;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('[data-cmp-pick]', list).forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      pick(button.dataset.cmpPick);
    }));
    rowLinks = $$('.prow-link:not(.is-off)', list);
    persist();
    refreshIcons();
  };

  /* ---------------- wiring ---------------- */
  const setQuery = value => {
    state.q = value;
    if (search.value !== value) search.value = value;
    render();
  };
  search.value = state.q;
  search.addEventListener('input', event => setQuery(event.target.value));
  if (clearBtn) clearBtn.addEventListener('click', () => setQuery(''));
  orderSelect.addEventListener('change', () => { state.order = orderSelect.value; render(); });
  densityBtns.forEach(button => button.addEventListener('click', () => { state.density = button.dataset.density; render(); }));
  facetRow.addEventListener('click', event => {
    const chip = event.target.closest('[data-facet]');
    if (!chip) return;
    state.facet = chip.dataset.facet;
    render();
  });
  const clearAll = $('[data-clear-all]');
  if (clearAll) clearAll.addEventListener('click', () => { state.facet = 'all'; setQuery(''); });
  const cmpClear = $('[data-cmp-clear]');
  if (cmpClear) cmpClear.addEventListener('click', () => { state.cmp = []; render(); renderCompare(); });
  const cmpOpen = $('[data-cmp-open]');
  if (cmpOpen) cmpOpen.addEventListener('click', () => { cmpSheet.hidden = false; renderCompare(); $('[data-cmp-close]')?.focus(); });
  const cmpClose = $('[data-cmp-close]');
  if (cmpClose) cmpClose.addEventListener('click', () => { cmpSheet.hidden = true; });
  const focusSearch = () => { search.focus(); search.select(); };
  $$('[data-search-focus]').forEach(button => button.addEventListener('click', focusSearch));

  document.addEventListener('keydown', event => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
    const providersView = document.querySelector('[data-view="providers"]');
    const listHidden = () => !providersView || providersView.hidden;
    const goSearch = () => {
      if (listHidden() && window.AipRouter) window.AipRouter.show('providers');
      focusSearch();
    };
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); goSearch(); return; }
    if (event.key === 'Escape') {
      if (cmpSheet && !cmpSheet.hidden) { cmpSheet.hidden = true; return; }
      if (state.q) { setQuery(''); return; }
      if (typing) event.target.blur();
      return;
    }
    if (typing) return;
    if (event.key === '/') { event.preventDefault(); goSearch(); return; }
    if (listHidden() || !rowLinks.length) return;
    const current = rowLinks.indexOf(document.activeElement);
    if (event.key === 'j' || event.key === 'ArrowDown') {
      event.preventDefault();
      (rowLinks[current + 1] || rowLinks[0]).focus();
    } else if (event.key === 'k' || event.key === 'ArrowUp') {
      event.preventDefault();
      (rowLinks[current - 1] || rowLinks[rowLinks.length - 1]).focus();
    } else if (event.key === 'c' && current >= 0) {
      const id = rowLinks[current].closest('.prow')?.dataset.id;
      if (id) pick(id);
    }
  });

  /* ---------------- header facts ---------------- */
  const liveCount = $('[data-live-count]');
  const offCount = $('[data-off-count]');
  const guideCount = $('[data-guide-count]');
  if (liveCount) liveCount.textContent = String(providers.filter(p => !isOff(p)).length);
  if (offCount) offCount.textContent = String(providers.filter(isOff).length);
  if (guideCount) guideCount.textContent = String(providers.filter(p => p.guide && !isOff(p)).length);

  render();
  renderCompare();
  window.addEventListener('resize', syncCmpPad);

  /* shell API — used by js/views.js (category tiles, coverage rows) */
  window.aipList = {
    setFacet: id => {
      const facet = FACETS.find(f => f.id === id);
      if (!facet) return;
      state.facet = facet.id;
      render();
    },
    setQuery: value => setQuery(value),
    clearAll: () => { state.facet = 'all'; setQuery(''); },
    pick
  };
})();
