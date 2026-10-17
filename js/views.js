/* views — renders the provider card grid, the hero stats and the provider
   details modal. Rendering is delegated; data comes from window.Adapters. */
(() => {
  const A = window.Adapters;
  const esc = A.esc;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const refreshIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  };

  const protoLabel = key => (key === 'anthropic' ? 'Anthropic' : key === 'openai' ? 'OpenAI' : key);
  const FREE_SHAPE = { 'signup-credit': 'signup credit', 'invite-bonus': 'invite bonus', 'free-tier': 'free tier' };
  const PALETTE = ['', 'v--violet', 'v--amber', 'v--coral'];
  const MODEL_PREVIEW = 4;

  /* ---------------- hero glass band ----------------
     Decorative, staggered columns of frosted tiles carrying the providers'
     own bundled logos (the shared brand mark is never repeated here).
     'blank' leaves a tile empty so the composition stays airy, and --dy
     staggers each column vertically. The band is masked in CSS so it fades
     into the page instead of ending on a hard edge. */
  const HERO_COLUMNS = [
    { dy: 46, tiles: ['logo', 'blank', 'logo'] },
    { dy: 0, tiles: ['logo', 'logo', 'logo'] },
    { dy: 60, tiles: ['blank', 'logo', 'blank'] },
    { dy: 18, tiles: ['logo', 'logo'] },
    { dy: 70, tiles: ['logo', 'blank', 'logo'] },
    { dy: 28, tiles: ['blank', 'logo'] },
    { dy: 52, tiles: ['logo', 'logo'] },
    { dy: 10, tiles: ['logo', 'blank', 'logo'] },
    { dy: 64, tiles: ['logo', 'logo'] },
    { dy: 34, tiles: ['blank', 'logo', 'logo'] }
  ];

  function heroLogos() {
    const seen = new Set();
    const out = [];
    A.providers.forEach(p => {
      const src = A.logo(p);
      if (src.includes('gorouterlogo') || seen.has(src)) return;
      seen.add(src);
      out.push(src);
    });
    return out;
  }

  function renderHero() {
    const stack = $('[data-hero-stack]');
    if (!stack) return;
    const logos = heroLogos();
    let next = 0;
    stack.innerHTML = HERO_COLUMNS.map(col => `
      <div class="hero-col" style="--dy:${col.dy}px">${
        col.tiles.map(kind => {
          const src = kind === 'logo' ? logos[next++] : '';
          return src
            ? `<span class="hero-tile"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></span>`
            : '<span class="hero-tile is-blank"></span>';
        }).join('')
      }</div>`).join('');
  }

  /* ---------------- provider details modal ---------------- */
  const modal = {
    veil: $('[data-prov-modal]'),
    card: $('[data-prov-card]'),
    logo: $('[data-prov-modal-logo]'),
    name: $('[data-prov-modal-name]'),
    kind: $('[data-prov-modal-kind]'),
    blurb: $('[data-prov-modal-blurb]'),
    credit: $('[data-prov-modal-credit]'),
    models: () => $('.prov-models', $('[data-prov-modal]')),
    facts: () => $('.prov-facts', $('[data-prov-modal]')),
    act: () => $('.prov-act', $('[data-prov-modal]'))
  };
  let lastFocus = null;

  /* the modal shows the provider's own bundled logo; missing files fall back
     to the shared brand mark (guarded so it can never loop) */
  if (modal.logo) modal.logo.addEventListener('error', () => {
    if (!String(modal.logo.src).includes('gorouterlogo.png')) modal.logo.src = 'assets/gorouterlogo.png';
  });

  /* the free-credit line is DERIVED from documented fields only (never invented) */
  function creditNote(p) {
    const offer = (p.offer || '').trim();
    if (p.freeShape === 'signup-credit' || p.signupCredit) return offer || 'Sign in to claim the free starting credits.';
    if (p.freeShape === 'invite-bonus') return offer || 'Bonus credits are granted on an invite.';
    if (p.freeShape === 'free-tier') return offer || 'A free tier is available once you sign in.';
    return '';
  }

  function fillProvider(p) {
    modal.logo.src = A.logo(p);
    modal.logo.alt = '';
    modal.card.classList.toggle('is-off', A.isOff(p));
    modal.name.textContent = p.name;

    const protos = (p.protocol || []).map(protoLabel).join(' · ');
    const kind = A.kindLabel(p);
    const bits = [A.isOff(p) ? 'offline' : 'live now'];
    if (kind) bits.push(kind);
    if (protos) bits.push(`${protos} route${(p.protocol || []).length > 1 ? 's' : ''}`);
    if (FREE_SHAPE[p.freeShape]) bits.push(FREE_SHAPE[p.freeShape]);
    modal.kind.textContent = bits.join('  ·  ');
    modal.kind.classList.toggle('is-off', A.isOff(p));

    modal.blurb.textContent = p.blurb || '';

    const note = creditNote(p);
    modal.credit.textContent = note;
    modal.credit.hidden = !note;

    const list = p.models || [];
    const shown = list.slice(0, 24);
    modal.models().innerHTML = shown.length
      ? shown.map(m => `<code>${esc(m)}</code>`).join('') +
        (list.length > shown.length ? `<code class="more">+${list.length - shown.length} more</code>` : '')
      : (p.modelsNote ? `<code class="more">${esc(p.modelsNote)}</code>`
        : '<code class="more">models unknown — the provider does not publish its model IDs</code>');

    const rows = [
      ['Client route', protos ? esc(protos) : 'not documented'],
      ['Kind', kind ? esc(kind) : 'unknown'],
      ['Card', p.noCard === true ? 'no card needed' : 'check the provider\u2019s own wording'],
      ['Pricing', p.offer ? esc(p.offer) : 'see the provider\u2019s sign-up page'],
      ['Setup guide', p.guide ? `<a href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer">open provider guide</a>` : 'none'],
      ['Added', esc(p.addedAt || 'unknown')]
    ];
    modal.facts().innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    modal.act().innerHTML = A.isOff(p)
      ? '<span class="prov-offline" aria-disabled="true"><i data-lucide="circle-off"></i>Unavailable — this provider is offline</span>'
      : `<a class="prov-signin" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Get API <i data-lucide="arrow-up-right"></i></a>`;
    refreshIcons();
  }

  function openProvider(id) {
    const p = A.providers.find(x => x.id === id);
    if (!p || !modal.veil) return;
    fillProvider(p);
    lastFocus = document.activeElement;
    modal.veil.hidden = false;
    document.body.classList.add('modal-open');
    $('[data-prov-close]', modal.veil)?.focus();
  }

  function closeModal() {
    if (!modal.veil || modal.veil.hidden) return;
    modal.veil.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus instanceof HTMLElement) { lastFocus.focus(); lastFocus = null; }
  }

  function trapFocus(event) {
    if (!modal.veil || modal.veil.hidden || event.key !== 'Tab') return;
    const focusables = $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', modal.veil)
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* ---------------- card grid ----------------
     Every tile wears the shared brand mark (assets/gorouterlogo.png) as its
     logo; the provider's own logo shows up inside the details modal. */
  const CARD_LOGO = 'assets/gorouterlogo.png';

  /* the models a provider documents, listed under its name (never invented) */
  function modelList(p) {
    const list = p.models || [];
    if (!list.length) return '<ul class="api-models"><li class="more">models unknown</li></ul>';
    const shown = list.slice(0, MODEL_PREVIEW);
    const rest = list.length - shown.length;
    return `<ul class="api-models">${shown.map(m => `<li>${esc(m)}</li>`).join('')}${
      rest ? `<li class="more">+${rest} more</li>` : ''}</ul>`;
  }

  function cardMarkup(p, index) {
    const off = A.isOff(p);
    const meta = [
      off ? 'offline' : 'live',
      A.kindLabel(p),
      (p.protocol || []).map(protoLabel).join(' · '),
      FREE_SHAPE[p.freeShape]
    ].filter(Boolean).join('  ·  ');
    const action = off
      ? '<span class="api-btn" aria-disabled="true"><i data-lucide="circle-off"></i>Unavailable</span>'
      : `<a class="api-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Get API <i data-lucide="arrow-up-right"></i></a>`;
    return `<li class="api-card ${PALETTE[index % PALETTE.length]}${off ? ' is-off' : ''}">
      <button type="button" class="api-card-btn" data-prov-open="${esc(p.id)}"
        aria-label="${off ? 'Unavailable — details for' : 'Open details for'} ${esc(p.name)}">
        <span class="api-logo"><img src="${CARD_LOGO}" alt="" loading="lazy"></span>
        <span class="api-title">${esc(p.name)}${A.isNew(p) ? '<span class="api-chip">New</span>' : ''}</span>
        ${modelList(p)}
        <span class="api-desc">${esc(p.blurb || '')}</span>
        ${meta ? `<span class="api-meta">${esc(meta)}</span>` : ''}
      </button>
      <div class="api-actions">${action}</div>
    </li>`;
  }

  function renderGrid() {
    const grid = $('[data-provider-grid]');
    if (!grid) return;
    grid.innerHTML = A.featured.map(cardMarkup).join('');
  }

  /* ---------------- hero stats ---------------- */
  function renderStats() {
    const s = A.stats;
    const setText = (sel, value) => { const el = $(sel); if (el) el.textContent = value; };
    setText('[data-live-count]', s.live);
    setText('[data-off-count]', s.off);
    setText('[data-guide-count]', s.guides);
    /* a divided stat line, not badges: the number carries the tone, the
       words stay quiet, and the row wraps cleanly on narrow screens */
    const line = $('[data-stat-chips]');
    if (line) line.innerHTML = s.chips
      .map(c => {
        const parts = String(c.label).match(/^(\S+)\s+(.*)$/);
        const value = parts ? parts[1] : c.label;
        const text = parts ? parts[2] : '';
        return `<li class="${c.tone}"><b>${esc(value)}</b>${text ? `<span>${esc(text)}</span>` : ''}</li>`;
      }).join('');
  }

  /* ---------------- global click delegation ---------------- */
  function wireClicks() {
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-nav]');
      if (nav && window.AipRouter) { window.AipRouter.show(nav.dataset.nav); return; }

      const opener = event.target.closest('[data-prov-open]');
      if (opener) { event.preventDefault(); openProvider(opener.dataset.provOpen); return; }

      if (event.target.closest('[data-prov-close]')) { closeModal(); return; }
      if (event.target === modal.veil) { closeModal(); return; }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.veil && !modal.veil.hidden) { closeModal(); return; }
    trapFocus(event);
  });

  window.Views = { openProvider, closeModal };

  renderGrid();
  renderStats();
  renderHero();
  wireClicks();
  refreshIcons();
})();
