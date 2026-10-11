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

  /* ================= Provider directory ================= */
  const providers = window.PROVIDERS || [];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const badgeMarkup = flags => {
    const out = [];
    if (flags.includes('new')) out.push('<span class="new-badge">NEW</span>');
    if (flags.includes('hot')) out.push('<span class="hot-badge">HOT</span>');
    return out.join('');
  };
  const modelsMarkup = provider => {
    if (provider.models && provider.models.length) {
      const shown = provider.models.slice(0, 6).map(m => `<code class="model-chip">${escapeHtml(m)}</code>`).join('');
      const rest = provider.models.length > 6 ? `<code class="model-chip model-more">+${provider.models.length - 6} more</code>` : '';
      return `${shown}${rest}`;
    }
    if (provider.modelsNote) return `<code class="model-chip model-more">${escapeHtml(provider.modelsNote)}</code>`;
    return '<code class="model-chip model-more">model list in dashboard</code>';
  };
  const cardMarkup = provider => {
    const off = provider.status === 'off';
    const primary = off
      ? `<span class="provider-link provider-button is-disabled" aria-disabled="true"><img class="provider-button-logo" src="${escapeHtml(provider.logo)}" alt=""><span>Sign-up disabled</span><i class="button-arrow" data-lucide="ban"></i></span>`
      : `<a class="provider-link provider-button" href="${escapeHtml(provider.url)}" target="_blank" rel="noopener noreferrer"><img class="provider-button-logo" src="${escapeHtml(provider.logo)}" alt=""><span>Open sign-up link</span><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`;
    const guide = provider.guide && !off
      ? `<a class="provider-link provider-guide" href="${escapeHtml(provider.guide)}" target="_blank" rel="noopener noreferrer"><i data-lucide="book-open"></i><span>Open setup guide</span><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`
      : '';
    return `<article class="provider-card${off ? ' is-disabled' : ''}" data-id="${provider.id}" data-name="${escapeHtml(provider.name.toLowerCase())}" data-blurb="${escapeHtml(provider.blurb.toLowerCase())}" data-models="${escapeHtml((provider.models || []).concat(provider.modelsNote ? [provider.modelsNote.toLowerCase()] : []).join(' '))}" data-flags="${provider.flags.join(' ')}" data-status="${provider.status}">
      <div class="provider-head">
        <span class="cta-icon"><img src="${provider.logo}" alt=""></span>
        <div class="provider-title">
          <h3>${escapeHtml(provider.name)} ${provider.flags.includes('newapi') ? '<span class="newapi-chip">New API</span>' : ''}${badgeMarkup(provider.flags)}</h3>
          <span class="status${off ? ' status-off' : ''}"><span></span>${off ? 'Service offline' : 'External service'}</span>
        </div>
      </div>
      <p>${escapeHtml(provider.blurb)}</p>
      <div class="model-row">${modelsMarkup(provider)}</div>
      ${off ? '' : '<div class="perk-line"><i data-lucide="star"></i><span>Bonus credit when you sign up through this link.</span></div>'}
      <div class="provider-actions">${primary}${guide}</div>
    </article>`;
  };

  const grid = $('[data-provider-grid]');
  const heroSearch = $('[data-hero-search]');
  const dirSearch = $('[data-directory-search]');
  const chips = $$('[data-filter-chip]');
  const count = $('[data-directory-count]');
  const liveCount = $('[data-live-count]');
  const newCount = $('[data-new-count]');
  const emptyState = $('[data-directory-empty]');
  let activeFilter = 'all';

  const visibleOf = p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'off') return p.status === 'off';
    if (activeFilter === 'newapi') return p.status === 'live' && p.flags.includes('newapi');
    return p.status === 'live' && p.flags.includes(activeFilter);
  };

  const sortProviders = list => {
    const compareNames = (a, b) => a.name.replace(/\s+AI$/i, '').localeCompare(b.name.replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' });
    const newApi = list.filter(p => p.status === 'live' && p.flags.includes('newapi')).sort(compareNames);
    const rest = list.filter(p => p.status === 'live' && !p.flags.includes('newapi')).sort(compareNames);
    const off = list.filter(p => p.status === 'off').sort(compareNames);
    return [...newApi, ...rest, ...off];
  };

  const matchesQuery = (provider, q) => {
    if (!q) return true;
    const hay = `${provider.name} ${provider.blurb} ${(provider.models || []).join(' ')} ${provider.modelsNote || ''} ${provider.flags.join(' ')}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(token => hay.includes(token));
  };

  const render = () => {
    const q = (dirSearch?.value || '').trim();
    const shown = sortProviders(providers).filter(p => visibleOf(p) && matchesQuery(p, q));
    if (grid) grid.innerHTML = shown.map(cardMarkup).join('');
    if (emptyState) emptyState.hidden = shown.length > 0;
    if (count) count.textContent = `${providers.length} providers · ${shown.length} shown`;
    chips.forEach(chip => {
      const filter = chip.dataset.filterChip;
      const total = filter === 'all' ? providers.length : filter === 'off' ? providers.filter(p => p.status === 'off').length : providers.filter(p => p.status === 'live' && p.flags.includes(filter)).length;
      chip.dataset.count = String(total);
    });
    const clearBtn = $('[data-clear-search]');
    if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);
    refreshIcons();
    observeCards();
  };

  const revealObserver = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); }
      }), { rootMargin: '0px 0px -6% 0px' })
    : null;
  const observeCards = () => {
    if (!grid) return;
    $$('.provider-card', grid).forEach((card, i) => {
      if (!revealObserver) { card.classList.add('is-revealed'); return; }
      card.style.transitionDelay = `${Math.min(i % 6, 5) * 45}ms`;
      revealObserver.observe(card);
    });
  };

  const applySearch = value => {
    if (dirSearch && dirSearch.value !== value) dirSearch.value = value;
    if (heroSearch && heroSearch.value !== value) heroSearch.value = value;
    render();
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    activeFilter = chip.dataset.filterChip;
    chips.forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    render();
  }));
  dirSearch?.addEventListener('input', e => applySearch(e.target.value));
  heroSearch?.addEventListener('input', e => { applySearch(e.target.value); });
  $('[data-clear-search]')?.addEventListener('click', () => applySearch(''));
  $('[data-clear-all]')?.addEventListener('click', () => {
    const allChip = chips.find(c => c.dataset.filterChip === 'all');
    if (allChip) allChip.click();
    applySearch('');
    document.getElementById('providers')?.scrollIntoView({ behavior: 'smooth' });
  });
  heroSearch?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('providers')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (grid) {
    render();
    const live = providers.filter(p => p.status === 'live').length;
    const fresh = providers.filter(p => p.status === 'live' && p.flags.includes('new')).length;
    if (liveCount) liveCount.textContent = live;
    if (newCount) newCount.textContent = fresh;
  }

  /* Footer shortcuts render from the same data */
  const footerGrid = $('[data-provider-footer]');
  if (footerGrid) {
    footerGrid.innerHTML = sortProviders(providers).map(p => {
      const off = p.status === 'off';
      return off
        ? `<span class="provider-footer-button is-disabled" aria-disabled="true"><img src="${p.logo}" alt=""><span>${escapeHtml(p.name)} - unavailable</span><i class="button-arrow" data-lucide="ban"></i></span>`
        : `<a class="provider-footer-button" href="${p.url}" target="_blank" rel="noopener noreferrer"><img src="${p.logo}" alt=""><span>Go to ${escapeHtml(p.name)}</span><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`;
    }).join('');
    refreshIcons();
  }

  /* Credit offers render from the same data */
  const offerGrid = $('[data-offer-grid]');
  if (offerGrid) {
    offerGrid.innerHTML = sortProviders(providers).map(p => {
      const badges = badgeMarkup(p.flags);
      if (p.status === 'off') {
        return `<span class="offer-row is-disabled" aria-disabled="true"><span><b>${escapeHtml(p.name)} <span class="off-badge">Unavailable</span></b><small>${escapeHtml(p.offer)}</small></span><img class="offer-row-logo" src="${escapeHtml(p.logo)}" alt=""><i class="button-arrow" data-lucide="ban"></i></span>`;
      }
      return `<a class="offer-row" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"><span><b>${escapeHtml(p.name)} ${badges}</b><small>${escapeHtml(p.offer)}</small></span><img class="offer-row-logo" src="${escapeHtml(p.logo)}" alt=""><i class="button-arrow" data-lucide="arrow-up-right"></i></a>`;
    }).join('');
    refreshIcons();
  }

  /* Guide tab strip regenerates to match directory order; panels stay static */
  $$('[data-tab-strip]').forEach(strip => {
    const shell = strip.closest('[data-tabs]');
    if (!shell) return;
    const panels = $$('[data-panel]', shell);
    const panelIds = new Set(panels.map(el => el.dataset.panel));
    const ordered = sortProviders(providers).filter(p => panelIds.has(p.id));
    const firstLive = ordered.find(p => p.status === 'live');
    strip.innerHTML = ordered.map(p => {
      const off = p.status === 'off';
      const active = p === firstLive;
      return `<button class="tab${active ? ' active' : ''}" type="button" role="tab" aria-selected="${active}" data-tab="${p.id}"${off ? ' disabled' : ''}>${escapeHtml(p.name)}${p.flags.includes('newapi') ? ' <span class="newapi-chip">New API</span>' : ''}${off ? ' <span class="off-badge">Unavailable</span>' : ' ' + badgeMarkup(p.flags)}</button>`;
    }).join('');
    if (firstLive) panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === firstLive.id));
  });

  /* Tab clicking (wired after strip regeneration) */
  $$('[data-tabs]').forEach(tabShell => {
    const tabs = $$('[data-tab]', tabShell);
    const panels = $$('[data-panel]', tabShell);
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const key = tab.dataset.tab;
      tabs.forEach(item => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
      panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === key));
    }));
  });

  /* ================= Search overlay (sections + providers) ================= */
  const overlay = $('[data-search-overlay]');
  const input = $('[data-search-input]');
  const results = $('[data-search-results]');
  const searchable = $$('[data-searchable]');
  const providerIndex = providers.map(p => ({ id: p.id, name: p.name, blurb: p.blurb, models: (p.models || []).join(' '), note: p.modelsNote || '', status: p.status }));
  const closeSearch = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); };
  const openSearch = () => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); input.value = ''; renderResults(''); setTimeout(() => input.focus(), 0); };
  const renderResults = query => {
    const normalized = query.trim().toLowerCase();
    const providerHits = normalized ? providerIndex.filter(p => `${p.name} ${p.blurb} ${p.models} ${p.note}`.toLowerCase().includes(normalized)) : [];
    const sectionHits = searchable.filter(section => !normalized || section.innerText.toLowerCase().includes(normalized));
    const items = [
      ...providerHits.slice(0, 8).map(p => `<a class="search-result" href="#providers"><strong>${escapeHtml(p.name)} <em>${p.status === 'off' ? 'unavailable' : 'provider'}</em></strong><span>${escapeHtml(p.blurb.slice(0, 110))}</span></a>`),
      ...sectionHits.slice(0, 8).map(section => `<a class="search-result" href="#${section.id}"><strong>${$('h2', section)?.textContent || section.id}</strong><span>${($('p', section)?.textContent || '').slice(0, 110)}</span></a>`)
    ];
    results.innerHTML = items.join('') || '<div class="search-result"><strong>No matches</strong><span>Try a provider name, claude, codex, gpt, or 401.</span></div>';
    $$('.search-result', results).forEach(result => result.addEventListener('click', () => {
      closeSearch();
      if (normalized) applySearch(query.trim());
    }));
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
