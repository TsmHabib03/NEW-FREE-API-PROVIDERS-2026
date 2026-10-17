/* adapters — project window.PROVIDERS into the shell's views.
   Rules (unchanged): everything here is DERIVED from documented fields only.
   No fabricated quota / uptime / latency numbers anywhere. */
(() => {
  const providers = window.PROVIDERS || [];
  const PROVIDER_FALLBACK = 'assets/gorouterlogo.png';

  const isNew = p => p.status === 'live' && !!p.addedAt &&
    (Date.now() - new Date(`${p.addedAt}T00:00:00`).getTime()) / 864e5 <= 7;
  const isOff = p => p.status === 'off';
  const hasProto = (p, key) => (p.protocol || []).includes(key);
  const hasFlag = (p, flag) => (p.flags || []).includes(flag);
  const kindLabel = p => (p.kind && p.kind !== 'unknown')
    ? String(p.kind).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  /* Documentation completeness — one documented fact = one point (out of 8).
     A missing fact is a missing point: no guesses, no averages across fields. */
  function docChecklist(p) {
    return [
      ['Sign-up page', !!p.url && !isOff(p)],
      ['What it is', !!p.blurb],
      ['Provider kind', p.kind && p.kind !== 'unknown'],
      ['Client route', (p.protocol || []).length > 0],
      ['Published models', (p.models || []).length > 0 || !!p.modelsNote],
      ['Free shape', !!p.freeShape],
      ['No card needed', p.noCard === true],
      ['Setup guide', !!p.guide && !isOff(p)]
    ];
  }
  function docScore(p) {
    const bits = docChecklist(p).filter(([, ok]) => ok).length;
    return Math.round((bits / docChecklist(p).length) * 100);
  }

  /* category tiles → each action routes to an app.js facet or a search term */
  const CATEGORIES = [
    { id: 'claude', label: 'Works with Claude Code', icon: 'bot-message-square', countFacet: 'claude' },
    { id: 'codex', label: 'Works with Codex', icon: 'square-terminal', countFacet: 'codex' },
    { id: 'newapi', label: 'New API gateways', icon: 'server', countFacet: 'newapi' },
    { id: 'nocard', label: 'No card needed', icon: 'credit-card', countFacet: 'nocard' },
    { id: 'guide', label: 'Setup guide available', icon: 'book-open', countFacet: 'guide' },
    { id: 'openai', label: 'OpenAI-compatible route', icon: 'arrow-up-right', countQuery: 'openai' },
    { id: 'anthropic', label: 'Anthropic-compatible route', icon: 'arrow-up-left', countQuery: 'anthropic' },
    { id: 'terminal-agent', label: 'Terminal-agent gateways', icon: 'terminal', countQuery: 'terminal-agent' },
    { id: 'off', label: 'Currently unavailable', icon: 'circle-off', countFacet: 'off' }
  ];
  const catCount = cat => {
    if (cat.countFacet === 'claude') return providers.filter(p => !isOff(p) && hasProto(p, 'anthropic')).length;
    if (cat.countFacet === 'codex') return providers.filter(p => !isOff(p) && hasProto(p, 'openai')).length;
    if (cat.countFacet === 'newapi') return providers.filter(p => !isOff(p) && hasFlag(p, 'newapi')).length;
    if (cat.countFacet === 'nocard') return providers.filter(p => !isOff(p) && p.noCard === true).length;
    if (cat.countFacet === 'guide') return providers.filter(p => !isOff(p) && !!p.guide).length;
    if (cat.countFacet === 'off') return providers.filter(isOff).length;
    const parts = [];
    if (cat.id === 'openai') parts.push('openai');
    if (cat.id === 'anthropic') parts.push('anthropic');
    if (cat.id === 'terminal-agent') parts.push('terminal-agent');
    const q = parts.join(' ').toLowerCase();
    return providers.filter(p => [
      p.name, p.blurb, p.offer, p.kind, p.freeShape, p.addedAt,
      (p.models || []).join(' '), p.modelsNote || '',
      (p.protocol || []).join(' '), (p.flags || []).join(' '),
      p.guide ? 'setup guide' : ''
    ].join(' ').toLowerCase().includes(q)).length;
  };

  /* coverage rows → same documented fields, listed as counts */
  const COVERAGE = [
    { label: 'Live right now', icon: 'radio', count: providers.filter(p => !isOff(p)).length, go: { query: '' } },
    { label: 'New API gateways', icon: 'server', count: providers.filter(p => hasFlag(p, 'newapi')).length, go: { facet: 'newapi' } },
    { label: 'Anthropic routes', icon: 'arrow-up-left', count: providers.filter(p => hasProto(p, 'anthropic')).length, go: { query: 'anthropic' } },
    { label: 'OpenAI routes', icon: 'arrow-up-right', count: providers.filter(p => hasProto(p, 'openai')).length, go: { query: 'openai' } },
    { label: 'No card needed', icon: 'credit-card', count: providers.filter(p => p.noCard === true).length, go: { facet: 'nocard' } },
    { label: 'Signup credit tiers', icon: 'coins', count: providers.filter(p => p.freeShape === 'signup-credit' || p.freeShape === 'invite-bonus').length, go: { query: 'signup-credit' } },
    { label: 'With setup guide', icon: 'book-open', count: providers.filter(p => !!p.guide).length, go: { facet: 'guide' } },
    { label: 'Unavailable / offline', icon: 'circle-off', count: providers.filter(isOff).length, go: { facet: 'off' } }
  ].map(row => ({ ...row, percent: Math.round((row.count / providers.length) * 100) }));

  /* dashboard feature cards = newest live providers (max 9), then remaining archived */
  const featured = providers.filter(p => !isOff(p)).sort((a, b) =>
    String(b.addedAt || '').localeCompare(String(a.addedAt || ''))).slice(0, 9);

  window.Adapters = {
    providers, isNew, isOff, hasProto, hasFlag, kindLabel,
    docChecklist, docScore, CATEGORIES, catCount, COVERAGE,
    featured,
    esc: value => String(value == null ? '' : value)
      .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
    logo: p => p.logo || PROVIDER_FALLBACK
  };
})();
