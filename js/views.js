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
  const PALETTE = ['v--blue', 'v--teal', 'v--violet', 'v--amber', 'v--rose', 'v--green'];
const MODEL_PREVIEW = 4;
/* model chips wrap to one per row once the ids are long, so the visible count
   has to shrink with the viewport or the details sheet stops fitting a phone */
const modalModelCap = () => {
  const w = window.innerWidth, h = window.innerHeight;
  if (w <= 380 || h <= 620) return 4;
  if (w <= 900 || h <= 760) return 6;
  return 12;
};
  /* stride the palette so no two neighbours ever share a tone */
  const toneFor = index => PALETTE[(index * 2 + Math.floor(index / 3)) % PALETTE.length];

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
    notice: $('[data-prov-modal-notice]'),
    models: () => $('.prov-models', $('[data-prov-modal]')),
    facts: () => $('.prov-facts', $('[data-prov-modal]')),
    act: () => $('.prov-act', $('[data-prov-modal]'))
  };
  let lastFocus = null;
  let currentId = null;

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
    currentId = p.id;
    modal.logo.src = A.logo(p);
    modal.logo.alt = '';
    modal.card.classList.toggle('is-off', A.isOff(p));
    modal.card.classList.toggle('is-flagged', A.isCaveat(p));
    modal.name.textContent = p.name;

    const protos = (p.protocol || []).map(protoLabel).join(' · ');
    const kind = A.kindLabel(p);
    const bits = [A.isOff(p) ? 'offline' : A.isCaveat(p) ? A.statusLabel(p).toLowerCase() : 'live now'];
    if (kind) bits.push(kind);
    if (protos) bits.push(`${protos} route${(p.protocol || []).length > 1 ? 's' : ''}`);
    if (FREE_SHAPE[p.freeShape]) bits.push(FREE_SHAPE[p.freeShape]);
    modal.kind.textContent = bits.join('  ·  ');
    modal.kind.classList.toggle('is-off', A.isOff(p));
    modal.kind.classList.toggle('is-flagged', A.isCaveat(p));

    modal.blurb.textContent = p.blurb || '';

    const caveat = A.isCaveat(p) ? (p.statusNote || '') : '';
    modal.notice.textContent = caveat;
    modal.notice.hidden = !caveat;

    const note = creditNote(p);
    modal.credit.textContent = note;
    modal.credit.hidden = !note;

    const list = p.models || [];
    const shown = list.slice(0, modalModelCap());
    modal.models().innerHTML = shown.length
      ? shown.map(m => `<code>${esc(m)}</code>`).join('') +
        (list.length > shown.length ? `<code class="more">+${list.length - shown.length} more</code>` : '')
      : (p.modelsNote ? `<code class="more">${esc(p.modelsNote)}</code>`
        : '<code class="more">models unknown — the provider does not publish its model IDs</code>');

    const rows = [
      ['Client route', protos ? esc(protos) : 'not documented', !!(kind || protos)],
      ['Kind', kind ? esc(kind) : 'unknown', !!(kind || protos)],
      ['Card', p.noCard === true ? 'no card needed' : 'check the provider\u2019s own wording', false],
      ['Pricing', p.offer ? esc(p.offer) : 'see the provider\u2019s sign-up page', false],
      ['Setup guide', p.guide ? `<a href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer">open provider guide</a>` : 'none', false],
      ['Added', esc(p.addedAt || 'unknown'), false]
    ];
    modal.facts().innerHTML = rows.map(([k, v, redundant]) =>
      `<div${redundant ? ' class="is-redundant"' : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    modal.act().innerHTML = A.isOff(p)
      ? '<span class="prov-offline" aria-disabled="true"><i data-lucide="circle-off"></i>Unavailable — this provider is offline</span>'
      : `<a class="prov-signin" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Get API <i data-lucide="arrow-up-right"></i></a>`;

    const guideBox = $('[data-prov-guide]');
    if (guideBox) guideBox.hidden = !p.onboarding;
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
    if (guide.veil && !guide.veil.hidden) closeGuide();
    if (!modal.veil || modal.veil.hidden) return;
    modal.veil.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus instanceof HTMLElement) { lastFocus.focus(); lastFocus = null; }
  }

  /* ---------------- provider onboarding guide ----------------
     A second dialog stacked over the details modal. Its content comes from
     p.onboarding in providers.js, so no step or link is duplicated in HTML. */
  const guide = {
    veil: $('[data-guide-modal]'),
    title: $('[data-guide-title]'),
    intro: $('[data-guide-intro]'),
    window: $('[data-guide-window]'),
    steps: $('[data-guide-steps]'),
    codeBtn: $('[data-copy-code]'),
    codeLabel: $('[data-copy-label]'),
    status: $('[data-copy-status]'),
    link: $('[data-guide-link]')
  };
  let guideFocus = null;
  let copyTimer = null;

  function fillGuide(p) {
    const on = p.onboarding;
    guide.title.textContent = on.title;
    guide.intro.textContent = on.intro;
    guide.window.textContent = on.window;
    guide.steps.innerHTML = on.steps.map(step => `<li><span>${esc(step.text)}</span>${
      step.link ? ` <a href="${esc(step.link.href)}" target="_blank" rel="noopener noreferrer">${esc(step.link.label)}</a>` : ''
    }</li>`).join('');
    guide.codeBtn.dataset.copyCode = on.code;
    $('code', guide.codeBtn).textContent = on.code;
    guide.codeLabel.textContent = 'Copy';
    guide.status.textContent = '';
    guide.link.href = on.link.href;
    guide.link.innerHTML = `Open ${esc(on.link.label)} <i data-lucide="arrow-up-right"></i>`;
  }

  function openGuide() {
    const p = A.providers.find(x => x.id === currentId);
    if (!p || !p.onboarding || !guide.veil) return;
    fillGuide(p);
    guideFocus = document.activeElement;
    guide.veil.hidden = false;
    refreshIcons();
    $('[data-guide-close]', guide.veil)?.focus();
  }

  function closeGuide() {
    if (!guide.veil || guide.veil.hidden) return;
    guide.veil.hidden = true;
    if (guideFocus instanceof HTMLElement && guideFocus.offsetParent !== null) guideFocus.focus();
    guideFocus = null;
  }

  function copyGuideCode(button) {
    const text = button.dataset.copyCode || '';
    const fallback = () => {
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
    const settle = ok => {
      guide.codeLabel.textContent = ok ? 'Copied' : 'Select manually';
      guide.status.textContent = ok
        ? 'Invitation code copied to the clipboard.'
        : 'Copy failed — select the code and copy it manually.';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        guide.codeLabel.textContent = 'Copy';
        guide.status.textContent = '';
      }, 2400);
    };
    if (!navigator.clipboard?.writeText) { settle(fallback()); return; }
    navigator.clipboard.writeText(text).then(() => settle(true), () => settle(fallback()));
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const veil = guide.veil && !guide.veil.hidden ? guide.veil
      : modal.veil && !modal.veil.hidden ? modal.veil : null;
    if (!veil) return;
    const focusables = $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', veil)
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
    const caveat = A.isCaveat(p);
    const meta = [
      off ? 'offline' : caveat ? A.statusLabel(p).toLowerCase() : 'live',
      A.kindLabel(p),
      (p.protocol || []).map(protoLabel).join(' · '),
      FREE_SHAPE[p.freeShape]
    ].filter(Boolean).join('  ·  ');
    const action = off
      ? '<span class="api-btn" aria-disabled="true"><i data-lucide="circle-off"></i>Unavailable</span>'
      : `<a class="api-btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Get API <i data-lucide="arrow-up-right"></i></a>`;
    /* a flagged row leads with its status instead of the New chip */
    const chip = caveat ? `<span class="api-chip is-warn">${esc(A.statusLabel(p))}</span>`
      : (!off && A.isNew(p)) ? '<span class="api-chip">New</span>' : '';
    const note = caveat && p.statusNote ? `<span class="api-note">${esc(p.statusNote)}</span>` : '';
    return `<li class="api-card ${toneFor(index)}${off ? ' is-off' : ''}${caveat ? ' is-flagged' : ''}">
      <button type="button" class="api-card-btn" data-prov-open="${esc(p.id)}"
        aria-label="${off ? 'Unavailable — details for' : 'Open details for'} ${esc(p.name)}">
        <span class="api-logo"><img src="${CARD_LOGO}" alt="" loading="lazy"></span>
        <span class="api-title">${esc(p.name)}${chip}</span>
        ${modelList(p)}
        <span class="api-desc">${esc(p.blurb || '')}</span>
        ${note}
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

      if (event.target.closest('[data-guide-open]')) { openGuide(); return; }
      if (event.target.closest('[data-guide-close]')) { closeGuide(); return; }
      const copyBtn = event.target.closest('[data-copy-code]');
      if (copyBtn) { copyGuideCode(copyBtn); return; }
      if (event.target === guide.veil) { closeGuide(); return; }

      if (event.target.closest('[data-prov-close]')) { closeModal(); return; }
      if (event.target === modal.veil) { closeModal(); return; }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (guide.veil && !guide.veil.hidden) { closeGuide(); return; }
      if (modal.veil && !modal.veil.hidden) { closeModal(); return; }
    }
    trapFocus(event);
  });

  window.Views = { openProvider, closeModal };

  renderGrid();
  renderStats();
  renderHero();
  wireClicks();
  refreshIcons();
})();
