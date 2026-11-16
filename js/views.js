/* Provider discovery state and shared modal. Provider records remain the source of truth. */
(() => {
  const A = window.Adapters;
  const esc = A.esc;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const refreshIcons = () => window.lucide?.createIcons();
  const protoLabel = key => key === 'anthropic' ? 'Anthropic' : key === 'openai' ? 'OpenAI' : key;
  const FREE_SHAPE = { 'signup-credit': 'Free credit', 'invite-bonus': 'Invite bonus', 'free-tier': 'Free tier' };
  const shell = $('[data-directory-shell]');
  const sidebar = $('.filter-sidebar');
  const searchInput = $('[data-search-input]');
  const state = { query: '', quick: new Set(), expanded: new Set(), archives: new Set(), sort: 'curated', filters: Object.fromEntries(A.filters.map(g => [g.key, new Set()])) };
  const modal = {
    veil: $('[data-prov-modal]'), card: $('[data-prov-card]'), logo: $('[data-prov-modal-logo]'),
    name: $('[data-prov-modal-name]'), kind: $('[data-prov-modal-kind]'), blurb: $('[data-prov-modal-blurb]'),
    credit: $('[data-prov-modal-credit]'), notice: $('[data-prov-modal-notice]'), returned: $('[data-prov-modal-return]'),
    models: () => $('.prov-models', $('[data-prov-modal]')),
    facts: () => $('.prov-facts', $('[data-prov-modal]')), act: () => $('.prov-act', $('[data-prov-modal]'))
  };
  let lastFocus = null, currentId = null, filterFocus = null;
  const community = {
    veil: $('[data-community-modal]'), panel: $('[data-community-panel]'),
    title: $('[data-community-title]'), reading: $('[data-community-reading]'),
    opener: $('[data-community-open]')
  };
  const NOTICE_KEY = 'aip2026.community-notice';
  const NOTICE_VERSION = '2026-11-v1';
  let noticeMemory = null, noticeFocus = null;
  const noticeIsOpen = () => !!community.veil && !community.veil.hidden;

  function validNotice(raw) {
    try {
      const record = JSON.parse(raw);
      return record?.version === NOTICE_VERSION && ['acknowledged', 'dismissed'].includes(record.disposition) ? record : null;
    } catch { return null; }
  }
  function readNotice() {
    let record = noticeMemory;
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        const saved = validNotice(window[name].getItem(NOTICE_KEY));
        if (saved && (!record || saved.disposition === 'acknowledged')) record = saved;
      } catch { /* Storage access itself may throw; session or memory still works. */ }
    }
    noticeMemory = record;
    return record;
  }
  function saveNotice(disposition) {
    const previous = readNotice();
    noticeMemory = { version: NOTICE_VERSION, disposition: previous?.disposition === 'acknowledged' ? 'acknowledged' : disposition };
    const raw = JSON.stringify(noticeMemory);
    for (const name of ['localStorage', 'sessionStorage']) {
      try { window[name].setItem(NOTICE_KEY, raw); } catch { /* Page-memory suppression remains available. */ }
    }
  }
  function syncDialogBackground() {
    const open = noticeIsOpen() || !modal.veil.hidden || !guide.veil.hidden;
    shell.inert = open;
    const skip = $('.skip-link');
    if (skip) skip.inert = open || document.body.classList.contains('filters-open');
    document.body.classList.toggle('modal-open', open);
  }
  function restoreFocus(element) {
    const target = element instanceof HTMLElement && element.isConnected !== false && element.offsetParent !== null && !element.inert
      ? element : $('#main-content');
    target?.focus({ preventScroll: true });
  }
  function openNotice(automatic = false) {
    if (!community.veil || !community.panel || !community.title || !community.reading || noticeIsOpen()) return;
    if (automatic && (readNotice() || !modal.veil.hidden || !guide.veil.hidden || document.body.classList.contains('filters-open'))) return;
    const returnTarget = automatic ? $('#main-content') : document.activeElement;
    // The notice is a top-level dialog. Only provider details can nest a guide.
    closeModal(); closeFilters();
    noticeFocus = returnTarget;
    community.panel.scrollTop = 0;
    community.reading.scrollTop = 0;
    community.veil.hidden = false;
    syncDialogBackground();
    community.title.focus({ preventScroll: true });
  }
  function closeNotice(disposition = 'dismissed') {
    if (!noticeIsOpen()) return;
    saveNotice(disposition);
    community.veil.hidden = true;
    syncDialogBackground();
    const returnTarget = noticeFocus;
    noticeFocus = null;
    restoreFocus(returnTarget);
  }
  const safeUrl = value => {
    if (!value) return null;
    try { return /^https?:$/.test(new URL(value, location.href).protocol) ? value : value === 'setup.html' ? value : null; } catch { return null; }
  };
  const docsLink = p => safeUrl(A.docsUrl(p)) || 'setup.html';
  const metricsMarkup = p => '<dl class="api-metrics" aria-label="Published API metrics">' + A.metrics(p).map(m =>
    '<div><dt>' + esc(m.label) + '</dt><dd class="' + (m.value === null ? 'is-unknown' : '') + '">' + esc(m.display) + '</dd></div>').join('') + '</dl>';
  const external = url => url.startsWith('setup.html') ? '' : ' target="_blank" rel="noopener noreferrer"';
  const dateLabel = p => {
    const value = p.updatedAt || p.addedAt;
    if (!value) return 'Date unknown';
    const date = new Date(value + 'T12:00:00');
    return isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  function fillProvider(p) {
    currentId = p.id;
    modal.card.dataset.providerId = p.id;
    modal.logo.src = A.logo(p); modal.logo.alt = p.name + ' logo';
    modal.name.textContent = p.name;
    modal.returned.textContent = A.isReturned(p) ? p.name + ' is back' : '';
    modal.returned.hidden = !A.isReturned(p);
    modal.card.classList.toggle('is-off', A.isOff(p));
    modal.card.classList.toggle('is-flagged', A.isCaveat(p));
    modal.kind.textContent = [A.statusLabel(p), A.kindLabel(p)].filter(Boolean).join(' · ');
    modal.kind.classList.toggle('is-off', A.isOff(p));
    modal.kind.classList.toggle('is-flagged', A.isCaveat(p));
    modal.blurb.textContent = p.blurb || 'Provider details have not been published.';
    modal.credit.textContent = p.offer || '';
    modal.credit.hidden = !p.offer;
    const event = $('[data-prov-event]');
    event.hidden = !p.event;
    event.innerHTML = p.event ? '<p class="prov-event-kicker"><i data-lucide="zap"></i>' + esc(p.event.label) + '</p>' +
      '<p class="prov-event-duration">' + esc(p.event.duration) + '</p><ul>' +
      p.event.rewards.map(reward => '<li>' + esc(reward) + '</li>').join('') + '</ul>' : '';
    const routes = (p.protocol || []).map(protoLabel).join(' + ');
    const models = p.models || [];
    const modelSummary = models.length ? models.slice(0, 3).join(', ') + (models.length > 3 ? ' and ' + (models.length - 3) + ' more' : '') : p.modelsNote || 'Models not documented';
    $('[data-prov-modal-route]').textContent = modelSummary + ' · ' +
      (routes ? routes + ' client route' + ((p.protocol || []).length > 1 ? 's' : '') : 'Client route not documented');
    modal.notice.textContent = !A.isLive(p) ? p.statusNote || A.statusLabel(p) : '';
    modal.notice.hidden = A.isLive(p);
    modal.models().innerHTML = models.length ? models.map(m => '<code>' + esc(m) + '</code>').join('') :
      '<code class="more">' + esc(p.modelsNote || 'Models unknown — the provider does not publish its model IDs.') + '</code>';
    const facts = [
      ['Client route', routes || 'Not documented'], ['API Category', A.categories(p).join(', ')],
      ['Authentication', A.authTypes(p).map(A.authLabel).join(', ')], ['Card required', p.noCard ? 'No card needed' : 'Not documented'],
      ['Added', p.addedAt || 'Not documented'], ['Evidence checked', p.evidence?.checkedAt || 'Not documented'], ['Inference', 'Not tested for inference'], ...(p.softwareNote ? [['Software note', p.softwareNote + '. Visual UI comparison pending; no effect on rank.']] : []), ...(p.modelsNote ? [['Catalog note', p.modelsNote]] : []),
      ...(p.gatewayFeatures || []).map((feature, index) => ['Gateway feature ' + (index + 1), feature]),
      ...A.features(p).filter(([key]) => key === 'Data format' || key === 'Rate limit')
    ];
    modal.facts().innerHTML = facts.map(([key, value]) => '<div><dt>' + esc(key) + '</dt><dd>' + esc(value) + '</dd></div>').join('');
    $('[data-prov-modal-metrics]').innerHTML = metricsMarkup(p);
    const docs = docsLink(p), signup = safeUrl(p.url), official = safeUrl(p.officialUrl);
    const docsNote = $('[data-prov-docs-note]');
    docsNote.hidden = docs !== 'setup.html';
    docsNote.textContent = docs === 'setup.html' ? 'Provider documentation is not listed. View our client setup guides instead.' : '';
    modal.act().innerHTML = (official ? '<a class="prov-docs" data-track-action="docs" data-track-provider="' + esc(p.id) + '" href="' + esc(official) + '" target="_blank" rel="noopener noreferrer"><i data-lucide="globe"></i>Use its official website</a>' : '') +
      '<a class="prov-docs" data-track-action="docs" data-track-provider="' + esc(p.id) + '" href="' + esc(docs) + '"' + external(docs) + '><i data-lucide="book-open"></i>View Documentation</a>' +
      (A.isOff(p) || !signup ? '<span class="prov-offline" aria-disabled="true"><i data-lucide="circle-off"></i>' +
      (A.isOff(p) ? 'Disabled in this directory' : 'Sign-up link not available') + '</span>' :
      '<a class="prov-signin" data-track-action="' + (p.installNeeded ? 'install' : p.actionLabel === 'View resource' ? 'resource' : 'signup') + '" data-track-provider="' + esc(p.id) + '" href="' + esc(signup) + '" target="_blank" rel="noopener noreferrer">' + esc(p.actionLabel || 'Get API') + '<i data-lucide="arrow-right"></i></a>');
    const evidence = $('[data-prov-evidence]');
    evidence.innerHTML = '<strong>' + (A.checked(p) ? 'Checked' : 'Public research') + '</strong><span>Not tested for inference · ' + esc(p.evidence?.checkedAt?.slice(0,10) || 'Date unknown') + '</span>' + (p.evidence?.sources?.length ? '<details><summary>Evidence sources</summary><ul>' + p.evidence.sources.map((url,i)=>safeUrl(url) ? '<li><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Source ' + (i+1) + ' · ' + esc(new URL(url).hostname) + '</a></li>' : '').join('') + '</ul></details>' : '');
    $('.prov-technical', modal.card).open = false;
    $('[data-prov-guide]').hidden = !p.onboarding;
    modal.card.scrollTop = 0;
    refreshIcons();
  }
  function openProvider(id) {
    const p = A.providers.find(x => x.id === id);
    if (!p) return;
    closeNotice();
    closeFilters();
    fillProvider(p);
    if (modal.veil.hidden) lastFocus = document.activeElement;
    modal.veil.hidden = false;
    syncDialogBackground();
    $('[data-prov-close]').focus();
  }
  function closeModal() {
    if (!guide.veil.hidden) closeGuide();
    if (modal.veil.hidden) return;
    modal.veil.hidden = true;
    syncDialogBackground();
    restoreFocus(lastFocus); lastFocus = null;
  }
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
    modal.card.inert = true;
    refreshIcons();
    $('[data-guide-close]', guide.veil)?.focus();
  }

  function closeGuide() {
    if (!guide.veil || guide.veil.hidden) return;
    guide.veil.hidden = true;
    modal.card.inert = false;
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
    const veil = noticeIsOpen() ? community.veil : guide.veil && !guide.veil.hidden ? guide.veil
      : modal.veil && !modal.veil.hidden ? modal.veil : null;
    if (!veil) return;
    const focusables = $$('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', veil)
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const outsideTabOrder = !focusables.includes(document.activeElement);
    if (event.shiftKey && (document.activeElement === first || outsideTabOrder)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || outsideTabOrder)) { event.preventDefault(); first.focus(); }
  }


  const track = (event,props) => window.DirectoryAnalytics?.track(event,props);
  const filtering = () => !!state.query || !!state.quick.size || Object.values(state.filters).some(s=>s.size);
  const matches = p => A.matches(p,state.query,state.quick,state.filters);
  function renderFilters() {
    $('[data-filter-groups]').innerHTML = A.filters.map(group =>
      '<fieldset class="filter-group"><legend>' + esc(group.title) + '</legend>' + group.options.map(option => {
        const count = A.providers.filter(p => A.filterValues(p, group.key).includes(option.value)).length;
        return '<label class="filter-option"><input type="checkbox" data-filter-group="' + group.key + '" value="' + esc(option.value) + '"' +
          (state.filters[group.key].has(option.value) ? ' checked' : '') + (!count ? ' disabled' : '') + '><span>' + esc(option.label) +
          '</span><span class="filter-option-count">' + count + '</span></label>';
      }).join('') + '</fieldset>').join('');
  }
  function cardMarkup(p,placement='category') {
    const off=A.isOff(p), docs=docsLink(p), signup=safeUrl(p.url);
    const badges=[...(p.badges||[]),...(placement==='new'?['NEW','Checked']:[]),...(p.installNeeded && !(p.badges||[]).includes('Unverified')?['Install needed']:[])];
    const tags=badges.map(b=>'<span class="api-tag essential '+(b==='Back'?'return-label':b==='NEW'?'new':b==='Referral'?'route':'')+'">'+esc(b)+'</span>').join('') + (p.noCard?'<span class="api-tag">No card</span>':'') + (p.signupCredit?'<span class="api-tag">Free credits</span>':'') + (p.protocol||[]).slice(0,2).map(proto=>'<span class="api-tag route">'+esc(protoLabel(proto))+'</span>').join('');
    return '<li class="api-card'+(off?' is-off':A.isCaveat(p)?' is-flagged':'')+'" data-provider-id="'+esc(p.id)+'" data-placement="'+placement+'">'+
      '<div class="api-card-top"><span class="api-logo"><img src="'+esc(A.logo(p))+'" alt="" loading="lazy" width="40" height="40"></span><span class="api-date">'+esc(p.serviceType||'Provider')+'</span></div>'+
      '<h3 class="api-title"><button type="button" data-prov-open="'+esc(p.id)+'" aria-label="Open details for '+esc(p.name)+'">'+esc(p.name)+'</button></h3><div class="api-tags">'+tags+'</div>'+
      '<p class="api-desc">'+esc(p.blurb||'Details not documented.')+'</p>'+
      (placement==='new'?'<p class="check-label">Not tested for inference</p>':'')+
      '<div class="api-card-meta"><span class="status-dot"></span>'+esc(A.statusLabel(p))+'<span>·</span><span>Research '+esc(p.evidence?.checkedAt?.slice(0,10)||'date unknown')+'</span></div>'+
      '<div class="api-actions"><button type="button" class="button-primary" data-prov-open="'+esc(p.id)+'" aria-label="Details for '+esc(p.name)+'">Details</button><a class="button-secondary" data-track-action="docs" href="'+esc(docs)+'"'+external(docs)+' aria-label="Documentation for '+esc(p.name)+'">Docs</a>'+
      (off||!signup?'<span class="api-signup is-disabled" aria-disabled="true">Disabled</span>':'<a class="api-signup" data-track-action="'+(p.installNeeded?'install':p.actionLabel==='View resource'?'resource':'signup')+'" href="'+esc(signup)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(p.actionLabel||'Get started')+' for '+esc(p.name)+'">'+esc(p.actionLabel||'Get started')+'<i data-lucide="arrow-up-right"></i></a>')+'</div></li>';
  }
  function sorted(items) {
    return state.sort==='name'?[...items].sort((a,b)=>a.name.localeCompare(b.name)):state.sort==='newest'?[...items].sort((a,b)=>A.addedTime(b)-A.addedTime(a)||a.name.localeCompare(b.name)):items;
  }
  function renderGrid() {
    const force=filtering(), now=Date.now(), fresh=A.newItems(now).filter(matches), spot=A.spotlight(now);
    const pins=A.pins.filter(matches), total=A.providers.filter(matches).length;
    let html=pins.length?'<section class="directory-section pinned-section" aria-labelledby="pinned-title"><div class="section-heading"><div><h2 id="pinned-title">Pinned <span class="section-count">'+pins.length+'</span></h2><p>Selected by the directory owner.</p></div><i data-lucide="pin"></i></div><ol class="api-grid pinned-grid">'+pins.map(p=>cardMarkup(p,'pinned')).join('')+'</ol></section>':'';
    if(fresh.length) html+='<section class="directory-section new-section" aria-labelledby="new-title"><div class="section-heading"><div><h2 id="new-title">New this week</h2><p>Checked public pages · added within 14 days · not tested for inference</p></div><div class="strip-controls"><button class="icon-button" type="button" data-new-scroll="-1" aria-label="Scroll new providers left"><i data-lucide="arrow-left"></i></button><button class="icon-button" type="button" data-new-scroll="1" aria-label="Scroll new providers right"><i data-lucide="arrow-right"></i></button></div></div><div class="new-strip" data-new-strip tabindex="0" role="region" aria-label="New providers; use left and right arrow keys to scroll"><ol class="api-grid">'+fresh.map(p=>cardMarkup(p,'new')).join('')+'</ol></div></section>';
    const present=A.sections.filter(s=>s.items.some(matches));
    if(present.length) html+='<nav class="category-nav" data-category-nav aria-label="Provider categories">'+present.map(s=>'<a class="category-link" href="#category-'+s.key+'" data-category-link="'+s.key+'">'+esc(s.title)+' <span>'+s.items.filter(matches).length+'</span></a>').join('')+'</nav>';
    for(const section of present) {
      const items=sorted(section.items.filter(matches));
      const expanded=force||state.expanded.has(section.key), open=force||state.archives.has(section.key);
      const visible=expanded?items:items.slice(0,6), panelId='panel-'+section.key;
      html+='<section class="directory-section'+(section.archived?' archive-section':'')+'" id="category-'+section.key+'" data-section="'+section.key+'" aria-labelledby="title-'+section.key+'"><div class="section-heading"><div><h2 id="title-'+section.key+'">'+(section.archived?'<button class="archive-toggle" type="button" data-archive-toggle="'+section.key+'" aria-expanded="'+open+'" aria-controls="'+panelId+'">':'')+esc(section.title)+' <span class="section-count">'+items.length+'</span>'+(section.archived?'<i data-lucide="chevron-down"></i></button>':'')+'</h2><p>'+esc(section.description)+'</p></div>'+
      (!force && !section.archived && items.length>6?'<button class="section-expand button-secondary" type="button" data-section-expand="'+section.key+'" aria-expanded="'+expanded+'" aria-controls="'+panelId+'">'+(expanded?'Show less':'Show all ('+items.length+')')+'</button>':'')+'</div><div id="'+panelId+'"'+(section.archived&&!open?' hidden':'')+'><ol class="api-grid">'+visible.map(p=>cardMarkup(p)).join('')+'</ol>'+
      (!force&&section.archived&&items.length>6?'<button class="section-expand button-secondary" type="button" data-section-expand="'+section.key+'" aria-expanded="'+expanded+'" aria-controls="'+panelId+'">'+(expanded?'Show less':'Show all ('+items.length+')')+'</button>':'')+'</div></section>';
      if(section.key==='recurring' && spot && matches(spot)) html+='<section class="directory-section spotlight-section" aria-label="Weekly spotlight"><div class="section-heading"><div><h2>Spotlight this week</h2><p>Successful usage verified · rotates Mondays, Manila time</p></div></div><ol class="api-grid">'+cardMarkup(spot,'spotlight')+'</ol></section>';
    }
    $('[data-provider-grid]').innerHTML=html;
    $('[data-search-empty]').hidden=!!total;
    $('[data-results-heading]').textContent=force?'Matching providers':'Explore providers';
    $('[data-results-count]').textContent=total;
    $('[data-search-meta]').textContent=total+' providers'+(force?' matching your search and filters; all matching sections expanded':' in the directory, including collapsed sections');
    $('[data-search-clear]').hidden=!state.query;
    $$('[data-quick-filter]').forEach(b=>b.setAttribute('aria-pressed',String(state.quick.has(b.dataset.quickFilter))));
    const active=A.filters.flatMap(g=>g.options.filter(o=>state.filters[g.key].has(o.value)).map(o=>({...o,group:g.key})));
    $('[data-active-filters]').hidden=!active.length;
    $('[data-active-filters]').innerHTML=active.map(o=>'<button type="button" class="active-filter" data-remove-filter="'+o.group+'" data-filter-value="'+esc(o.value)+'">'+esc(o.label)+'<i data-lucide="x"></i></button>').join('');
    const n=active.length+state.quick.size;
    $('[data-filter-count]').hidden=!n; $('[data-filter-count]').textContent=n;
    $('[data-live-count]').textContent=A.stats.live;
    refreshIcons(); measureSticky();
  }
  function measureSticky() {
    const nav=$('[data-category-nav]');
    if(!nav?.getBoundingClientRect || !shell.style.setProperty) return;
    shell.style.setProperty('--category-height',nav.getBoundingClientRect().height+'px');
    shell.classList.toggle('no-sticky',nav.getBoundingClientRect().height>window.innerHeight*.25||window.innerHeight<500);
  }
  function resetFilters() { Object.values(state.filters).forEach(set=>set.clear());state.quick.clear();renderFilters();renderGrid(); }

  function closeFilters() {
    if (!document.body.classList.contains('filters-open')) return;
    document.body.classList.remove('filters-open');
    $('[data-filter-backdrop]').hidden = true;
    $('[data-filters-toggle]').setAttribute('aria-expanded','false');
    $$('.topbar,.directory-intro,.directory-main,.footer').forEach(el => el.inert = false);
    sidebar.setAttribute('role','complementary'); sidebar.removeAttribute('aria-modal');
    syncDialogBackground();
    restoreFocus(filterFocus); filterFocus = null;
  }
  function openFilters() {
    closeNotice(); closeModal();
    filterFocus = document.activeElement;
    document.body.classList.add('filters-open');
    $('[data-filter-backdrop]').hidden = false;
    $('[data-filters-toggle]').setAttribute('aria-expanded','true');
    $$('.topbar,.directory-intro,.directory-main,.footer').forEach(el => el.inert = true);
    sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true');
    syncDialogBackground();
    $('[data-filters-close]').focus();
  }
  document.addEventListener('change',event => {
    if (event.target.matches('[data-filter-group]')) {
      const input = event.target, set = state.filters[input.dataset.filterGroup];
      input.checked ? set.add(input.value) : set.delete(input.value); track('filter_toggle',{key:input.dataset.filterGroup,active:input.checked});renderGrid();
    }
    if (event.target.matches('[data-sort-select]')) { state.sort = event.target.value; renderGrid(); }
  });
  searchInput.addEventListener('input',() => {state.query = searchInput.value.trim(); renderGrid();});
  document.addEventListener('click',event => {
    const target = event.target;
    if (target.closest('[data-community-open]')) {openNotice();return;}
    if (noticeIsOpen()) {
      if (target.closest('[data-community-acknowledge]')) closeNotice('acknowledged');
      else if (target.closest('[data-community-close]') || target === community.veil) closeNotice();
      return;
    }
    const action=target.closest('[data-track-action]');
    if(action) {const card=action.closest('[data-provider-id]');track('provider_click',{providerId:action.dataset.trackProvider||card?.dataset.providerId,action:action.dataset.trackAction,placement:action.closest('[data-prov-modal]')?'modal':card?.dataset.placement||'category'});}
    const quick=target.closest('[data-quick-filter]');
    if(quick) {const key=quick.dataset.quickFilter;state.quick.has(key)?state.quick.delete(key):state.quick.add(key);track('filter_toggle',{key,active:state.quick.has(key)});renderGrid();return;}
    const disclosure=target.closest('[data-section-expand], [data-archive-toggle]');
    if(disclosure) {if(filtering()) return;const archive=!!disclosure.dataset.archiveToggle,key=disclosure.dataset.archiveToggle||disclosure.dataset.sectionExpand,set=archive?state.archives:state.expanded;set.has(key)?set.delete(key):set.add(key);track('category_expand',{category:key,expanded:set.has(key)});renderGrid();$(archive?'[data-archive-toggle="'+key+'"]':'[data-section-expand="'+key+'"]')?.focus({preventScroll:true});return;}
    const category=target.closest('[data-category-link]');
    if(category) {track('category_nav',{category:category.dataset.categoryLink});if(['review','disabled'].includes(category.dataset.categoryLink)&&!state.archives.has(category.dataset.categoryLink)) {state.archives.add(category.dataset.categoryLink);renderGrid();}return;}
    const scroll=target.closest('[data-new-scroll]');if(scroll){$('[data-new-strip]')?.scrollBy({left:Number(scroll.dataset.newScroll)*280,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    const opener = target.closest('[data-prov-open]');
    if (opener) {track('provider_click',{providerId:opener.dataset.provOpen,action:'details',placement:opener.closest('[data-provider-id]')?.dataset.placement||'category'}); event.preventDefault(); openProvider(opener.dataset.provOpen); return; }
    if (target.closest('[data-prov-close]') || target === modal.veil) {closeModal();return;}
    if (target.closest('[data-guide-open]')) {openGuide();return;}
    if (target.closest('[data-guide-close]') || target === guide.veil) {closeGuide();return;}
    const copy = target.closest('[data-copy-code]'); if (copy) {copyGuideCode(copy);return;}
    if (target.closest('[data-search-clear]')) {searchInput.value='';state.query='';renderGrid();searchInput.focus();return;}
    if (target.closest('[data-filters-reset]')) {resetFilters();return;}
    if (target.closest('[data-reset-all]')) {state.query='';searchInput.value='';resetFilters();return;}
    const remove = target.closest('[data-remove-filter]');
    if (remove) {state.filters[remove.dataset.removeFilter].delete(remove.dataset.filterValue);renderFilters();renderGrid();return;}
    if (target.closest('[data-filters-toggle]')) {openFilters();return;}
    if (target.closest('[data-filters-close]') || target === $('[data-filter-backdrop]')) {closeFilters();return;}
    const card = target.closest('[data-provider-id]');
    if (card && !target.closest('a,button,input')) {track('provider_click',{providerId:card.dataset.providerId,action:'details',placement:card.dataset.placement||'category'});openProvider(card.dataset.providerId);}
  });
  document.addEventListener('keydown',event => {
    if(event.target.matches('[data-category-link]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {const links=$$('[data-category-link]'),i=links.indexOf(event.target),n=event.key==='Home'?0:event.key==='End'?links.length-1:(i+(event.key==='ArrowRight'?1:-1)+links.length)%links.length;event.preventDefault();links[n].focus();return;}
    if(event.target.matches('[data-new-strip]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {event.preventDefault();event.target.scrollTo({left:event.key==='Home'?0:event.key==='End'?event.target.scrollWidth:event.target.scrollLeft+(event.key==='ArrowRight'?280:-280),behavior:'instant'});return;}
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!noticeIsOpen() && modal.veil.hidden && guide.veil.hidden && !document.body.classList.contains('filters-open')) searchInput.focus();
      return;
    }
    if (event.key === 'Escape') {
      if (noticeIsOpen()) {event.preventDefault();closeNotice();return;}
      if (!guide.veil.hidden) {closeGuide();return;}
      if (!modal.veil.hidden) {closeModal();return;}
      if (document.body.classList.contains('filters-open')) {closeFilters();return;}
      if (event.target === searchInput) {searchInput.value='';state.query='';renderGrid();}
    }
    if (document.body.classList.contains('filters-open') && event.key === 'Tab') {
      const controls=$$('button,input:not([disabled]),a[href]',sidebar).filter(el=>el.offsetParent!==null);
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      return;
    }
    trapFocus(event);
  });
  document.addEventListener('focusin', () => {
    if (noticeIsOpen() && !community.veil.contains(document.activeElement)) community.title.focus({ preventScroll: true });
  });
  document.addEventListener('error',event => {
    const img=event.target;
    if(img instanceof HTMLImageElement && !img.src.includes('gorouterlogo.png')) img.src='assets/gorouterlogo.png';
  },true);
  window.addEventListener('resize',() => {if(window.innerWidth>730) closeFilters();measureSticky();});
  let timer;
  function scheduleRefresh() {
    if(!window.setTimeout) return;
    window.clearTimeout(timer);
    const now=Date.now(), boundaries=[A.weekStart(now)+7*864e5,...A.providers.map(p=>A.addedTime(p)+14*864e5),...A.providers.map(p=>Date.parse(p.verification?.verifiedAt)+30*864e5)].filter(t=>t>now);
    timer=window.setTimeout(()=>{renderGrid();scheduleRefresh();},Math.min(2147483647,Math.max(1000,Math.min(...boundaries)-now+50)));
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderGrid();scheduleRefresh();}});
  scheduleRefresh();
  window.Views={openProvider,closeModal,openNotice,state,renderGrid,cardMarkup};
  renderFilters();renderGrid();refreshIcons();
  // Keep the hidden markup fail-open: a notice error cannot lock the directory.
  try {
    if (community.opener) community.opener.hidden = false;
    openNotice(true);
  } catch {
    if (community.veil) community.veil.hidden = true;
    syncDialogBackground();
  }
})();
