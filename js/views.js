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
  const state = { query: '', collection: 'all', sort: 'curated', filters: Object.fromEntries(A.filters.map(g => [g.key, new Set()])) };
  const modal = {
    veil: $('[data-prov-modal]'), card: $('[data-prov-card]'), logo: $('[data-prov-modal-logo]'),
    name: $('[data-prov-modal-name]'), kind: $('[data-prov-modal-kind]'), blurb: $('[data-prov-modal-blurb]'),
    credit: $('[data-prov-modal-credit]'), notice: $('[data-prov-modal-notice]'),
    models: () => $('.prov-models', $('[data-prov-modal]')),
    facts: () => $('.prov-facts', $('[data-prov-modal]')), act: () => $('.prov-act', $('[data-prov-modal]'))
  };
  let lastFocus = null, currentId = null, filterFocus = null;
  const safeUrl = value => {
    if (!value) return null;
    try { return /^https?:$/.test(new URL(value, location.href).protocol) ? value : value === 'setup.html' ? value : null; } catch { return null; }
  };
  const docsLink = p => safeUrl(A.docsUrl(p)) || 'setup.html';
  const metricsMarkup = p => '<dl class="api-metrics" aria-label="Published API metrics">' + A.metrics(p).map(m =>
    '<div><dt>' + esc(m.label) + '</dt><dd class="' + (m.value === null ? 'is-unknown' : '') + '">' + esc(m.display) + '</dd></div>').join('') + '</dl>';
  const external = url => url === 'setup.html' ? '' : ' target="_blank" rel="noopener noreferrer"';
  const dateLabel = p => {
    const value = p.updatedAt || p.addedAt;
    if (!value) return 'Date unknown';
    const date = new Date(value + 'T12:00:00');
    return isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  function fillProvider(p) {
    currentId = p.id;
    modal.logo.src = A.logo(p); modal.logo.alt = p.name + ' logo';
    modal.name.textContent = p.name;
    modal.card.classList.toggle('is-off', A.isOff(p));
    modal.card.classList.toggle('is-flagged', A.isCaveat(p));
    modal.kind.textContent = [A.statusLabel(p), A.kindLabel(p)].filter(Boolean).join(' · ');
    modal.kind.classList.toggle('is-off', A.isOff(p));
    modal.kind.classList.toggle('is-flagged', A.isCaveat(p));
    modal.blurb.textContent = p.blurb || 'Provider details have not been published.';
    modal.credit.textContent = p.offer || '';
    modal.credit.hidden = !p.offer;
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
      ['Added', p.addedAt || 'Not documented'], ...A.features(p).filter(([key]) => key === 'Data format' || key === 'Rate limit')
    ];
    modal.facts().innerHTML = facts.map(([key, value]) => '<div><dt>' + esc(key) + '</dt><dd>' + esc(value) + '</dd></div>').join('');
    $('[data-prov-modal-metrics]').innerHTML = metricsMarkup(p);
    const docs = docsLink(p), signup = safeUrl(p.url);
    const docsNote = $('[data-prov-docs-note]');
    docsNote.hidden = docs !== 'setup.html';
    docsNote.textContent = docs === 'setup.html' ? 'Provider documentation is not listed. View our client setup guides instead.' : '';
    modal.act().innerHTML = '<a class="prov-docs" href="' + esc(docs) + '"' + external(docs) + '><i data-lucide="book-open"></i>View Documentation</a>' +
      (A.isOff(p) || !signup ? '<span class="prov-offline" aria-disabled="true"><i data-lucide="circle-off"></i>' +
      (A.isOff(p) ? 'Unavailable — provider offline' : 'Sign-up link not available') + '</span>' :
      '<a class="prov-signin" href="' + esc(signup) + '" target="_blank" rel="noopener noreferrer">Get API<i data-lucide="arrow-right"></i></a>');
    $('.prov-technical', modal.card).open = false;
    $('[data-prov-guide]').hidden = !p.onboarding;
    modal.card.scrollTop = 0;
    refreshIcons();
  }
  function openProvider(id) {
    const p = A.providers.find(x => x.id === id);
    if (!p) return;
    closeFilters();
    fillProvider(p);
    if (modal.veil.hidden) lastFocus = document.activeElement;
    modal.veil.hidden = false; shell.inert = true;
    document.body.classList.add('modal-open');
    $('[data-prov-close]').focus();
  }
  function closeModal() {
    if (!guide.veil.hidden) closeGuide();
    if (modal.veil.hidden) return;
    modal.veil.hidden = true; shell.inert = false;
    document.body.classList.remove('modal-open');
    lastFocus?.focus(); lastFocus = null;
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
    const veil = guide.veil && !guide.veil.hidden ? guide.veil
      : modal.veil && !modal.veil.hidden ? modal.veil : null;
    if (!veil) return;
    const focusables = $$('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', veil)
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }


  function matches(p) {
    return Object.entries(state.filters).every(([key, values]) => !values.size || A.filterValues(p, key).some(value => values.has(value))) &&
      state.query.toLowerCase().trim().split(/\s+/).filter(Boolean).every(token =>
        [p.name, p.id, p.blurb, p.offer, ...A.categories(p), ...(p.models || [])].join(' ').toLowerCase().includes(token));
  }
  function renderFilters() {
    $('[data-filter-groups]').innerHTML = A.filters.map(group =>
      '<fieldset class="filter-group"><legend>' + esc(group.title) + '</legend>' + group.options.map(option => {
        const count = A.providers.filter(p => A.filterValues(p, group.key).includes(option.value)).length;
        return '<label class="filter-option"><input type="checkbox" data-filter-group="' + group.key + '" value="' + esc(option.value) + '"' +
          (state.filters[group.key].has(option.value) ? ' checked' : '') + (!count ? ' disabled' : '') + '><span>' + esc(option.label) +
          '</span><span class="filter-option-count">' + count + '</span></label>';
      }).join('') + '</fieldset>').join('');
  }
  function cardMarkup(p, featured = false) {
    const off = A.isOff(p), docs = docsLink(p);
    const signup = safeUrl(p.url);
    const tags = [
      FREE_SHAPE[p.freeShape] ? '<span class="api-tag">' + FREE_SHAPE[p.freeShape] + '</span>' : '',
      ...A.authTypes(p).filter(type => type !== 'unknown').map(type => '<span class="api-tag auth">' + esc(A.authLabel(type)) + '</span>'),
      ...(p.protocol || []).map(proto => '<span class="api-tag route">' + esc(protoLabel(proto)) + '</span>'),
      A.isNew(p) ? '<span class="api-tag new">New</span>' : '',
      !A.isLive(p) ? '<span class="api-tag status">' + A.statusLabel(p) + '</span>' : ''
    ].filter(Boolean).slice(0, 4).join('') || '<span class="api-tag route">' + esc(A.categories(p).join(' · ')) + '</span>';
    return '<li class="api-card' + (off ? ' is-off' : A.isCaveat(p) ? ' is-flagged' : '') + (featured ? ' api-featured' : '') + '" data-provider-id="' + esc(p.id) + '">' +
      '<div class="api-card-top"><span class="api-logo"><img src="' + esc(A.logo(p)) + '" alt="" loading="lazy" width="40" height="40"></span>' +
      '<div class="api-card-stamp">' + (featured ? '<span class="api-tag featured-label">Featured</span>' : '') +
      '<time class="api-date"' + (p.updatedAt || p.addedAt ? ' datetime="' + esc(p.updatedAt || p.addedAt) + '"' : '') + ' title="' + (p.updatedAt ? 'Updated' : 'Added') + ' ' + esc(p.updatedAt || p.addedAt || '') + '">' + esc(dateLabel(p)) + '</time></div></div>' +
      '<h3 class="api-title"><button type="button" data-prov-open="' + esc(p.id) + '" aria-label="Open details for ' + esc(p.name) + '">' + esc(p.name) + '</button></h3>' +
      '<p class="api-desc">' + esc(p.blurb || 'Provider details are not documented yet.') + '</p><div class="api-tags">' + tags + '</div>' +
      '<ul class="api-features">' + A.features(p).map(([key,value]) => '<li><span>' + esc(key) + '</span><strong>' + esc(value) + '</strong></li>').join('') + '</ul>' +
      (!A.isLive(p) && p.statusNote ? '<p class="api-note">' + esc(p.statusNote) + '</p>' : '') +
      '<div class="api-card-meta"><span class="status-dot"></span>' + esc(A.statusLabel(p)) + '<span>·</span>' +
      ((p.models || []).length ? p.models.length + ' documented models' : 'Models not documented') + '</div>' + metricsMarkup(p) +
      '<div class="api-actions"><button type="button" class="button-primary" data-prov-open="' + esc(p.id) + '" aria-label="Details for ' + esc(p.name) + '">Details</button>' +
      '<a class="button-secondary" href="' + esc(docs) + '"' + external(docs) + ' aria-label="Documentation for ' + esc(p.name) + '">Docs<i data-lucide="arrow-up-right"></i></a>' +
      (off || !signup ? '<span class="api-signup is-disabled" aria-disabled="true">' + (off ? 'Offline' : 'No link') + '</span>' :
      '<a class="api-signup" href="' + esc(signup) + '" target="_blank" rel="noopener noreferrer" aria-label="Get API from ' + esc(p.name) + '">Get API<i data-lucide="arrow-up-right"></i></a>') + '</div></li>';
  }
  function renderGrid() {
    const collection = A.collections.find(c => c.key === state.collection);
    let items = collection.items.filter(matches);
    if (state.sort === 'newest') items = [...items].sort((a,b) => String(b.updatedAt || b.addedAt || '').localeCompare(String(a.updatedAt || a.addedAt || '')) || a.name.localeCompare(b.name));
    if (state.sort === 'name') items = [...items].sort((a,b) => a.name.localeCompare(b.name));
    const featured = state.collection === 'all' && state.sort === 'curated' && !state.query && !Object.values(state.filters).some(s => s.size)
      ? items.find(p => p.id === 'agentrouter' && A.isLive(p) && safeUrl(p.url)) : null;
    if (featured) { items = items.filter(p => p !== featured); items.splice(Math.min(2, items.length),0,featured); }
    $('[data-provider-grid]').innerHTML = items.length ? '<ol class="api-grid">' + items.map(p => cardMarkup(p, p === featured)).join('') + '</ol>' : '';
    $('[data-search-empty]').hidden = !!items.length;
    $('[data-results-heading]').textContent = state.query ? 'Search results' : collection.title;
    $('[data-results-count]').textContent = items.length;
    $('[data-search-meta]').textContent = items.length + ' provider' + (items.length === 1 ? '' : 's') + (state.query ? ' matching “' + state.query + '”' : ' in this view');
    $('[data-search-clear]').hidden = !state.query;
    $$('[data-collection]').forEach(button => button.setAttribute('aria-current',String(button.dataset.collection === state.collection)));
    const active = A.filters.flatMap(g => g.options.filter(o => state.filters[g.key].has(o.value)).map(o => ({...o, group:g.key})));
    $('[data-active-filters]').hidden = !active.length;
    $('[data-active-filters]').innerHTML = active.map(o => '<button type="button" class="active-filter" data-remove-filter="' + o.group + '" data-filter-value="' + esc(o.value) + '" aria-label="Remove ' + esc(o.label) + ' filter">' + esc(o.label) + '<i data-lucide="x"></i></button>').join('');
    $('[data-filter-count]').hidden = !active.length; $('[data-filter-count]').textContent = active.length;
    $('[data-live-count]').textContent = A.stats.live;
    refreshIcons();
  }
  function resetFilters() { Object.values(state.filters).forEach(set => set.clear()); renderFilters(); renderGrid(); }
  function closeFilters() {
    if (!document.body.classList.contains('filters-open')) return;
    document.body.classList.remove('filters-open');
    $('[data-filter-backdrop]').hidden = true;
    $('[data-filters-toggle]').setAttribute('aria-expanded','false');
    $$('.topbar,.directory-intro,.directory-main,.footer').forEach(el => el.inert = false);
    sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal');
    filterFocus?.focus(); filterFocus = null;
  }
  function openFilters() {
    filterFocus = document.activeElement;
    document.body.classList.add('filters-open');
    $('[data-filter-backdrop]').hidden = false;
    $('[data-filters-toggle]').setAttribute('aria-expanded','true');
    $$('.topbar,.directory-intro,.directory-main,.footer').forEach(el => el.inert = true);
    sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true');
    $('[data-filters-close]').focus();
  }
  $('[data-collection-tabs]').innerHTML = A.collections.map(c => '<button class="collection-tab" type="button" data-collection="' + c.key + '" aria-current="' + (c.key === state.collection) + '">' + c.title + '</button>').join('');
  document.addEventListener('change',event => {
    if (event.target.matches('[data-filter-group]')) {
      const input = event.target, set = state.filters[input.dataset.filterGroup];
      input.checked ? set.add(input.value) : set.delete(input.value); renderGrid();
    }
    if (event.target.matches('[data-sort-select]')) { state.sort = event.target.value; renderGrid(); }
  });
  searchInput.addEventListener('input',() => {state.query = searchInput.value.trim(); renderGrid();});
  document.addEventListener('click',event => {
    const target = event.target;
    const opener = target.closest('[data-prov-open]');
    if (opener) { event.preventDefault(); openProvider(opener.dataset.provOpen); return; }
    if (target.closest('[data-prov-close]') || target === modal.veil) {closeModal();return;}
    if (target.closest('[data-guide-open]')) {openGuide();return;}
    if (target.closest('[data-guide-close]') || target === guide.veil) {closeGuide();return;}
    const copy = target.closest('[data-copy-code]'); if (copy) {copyGuideCode(copy);return;}
    const tab = target.closest('[data-collection]'); if (tab) {state.collection=tab.dataset.collection;renderGrid();return;}
    if (target.closest('[data-search-clear]')) {searchInput.value='';state.query='';renderGrid();searchInput.focus();return;}
    if (target.closest('[data-filters-reset]')) {resetFilters();return;}
    if (target.closest('[data-reset-all]')) {state.collection='all';state.query='';searchInput.value='';resetFilters();return;}
    const remove = target.closest('[data-remove-filter]');
    if (remove) {state.filters[remove.dataset.removeFilter].delete(remove.dataset.filterValue);renderFilters();renderGrid();return;}
    if (target.closest('[data-filters-toggle]')) {openFilters();return;}
    if (target.closest('[data-filters-close]') || target === $('[data-filter-backdrop]')) {closeFilters();return;}
    const card = target.closest('[data-provider-id]');
    if (card && !target.closest('a,button,input')) openProvider(card.dataset.providerId);
  });
  document.addEventListener('keydown',event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && modal.veil.hidden && guide.veil.hidden && !document.body.classList.contains('filters-open')) {event.preventDefault();searchInput.focus();return;}
    if (event.key === 'Escape') {
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
  document.addEventListener('error',event => {
    const img=event.target;
    if(img instanceof HTMLImageElement && !img.src.includes('gorouterlogo.png')) img.src='assets/gorouterlogo.png';
  },true);
  window.addEventListener('resize',() => {if(window.innerWidth>730) closeFilters();});
  window.Views={openProvider,closeModal};
  renderFilters();renderGrid();refreshIcons();
})();
