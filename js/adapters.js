/* adapters — project window.PROVIDERS into the hub's card grid.
   Rules (unchanged): everything here is DERIVED from documented fields only.
   No fabricated quota / uptime / latency numbers anywhere. */
(() => {
  const providers = window.PROVIDERS || [];
  const PROVIDER_FALLBACK = 'assets/gorouterlogo.png';

  const isNew = p => {
    const age = (Date.now() - new Date(`${p.addedAt}T00:00:00`).getTime()) / 864e5;
    return p.status === 'live' && !!p.addedAt && age >= 0 && age <= 7;
  };
  const isOff = p => p.status === 'off';
  const isRestricted = p => p.status === 'restricted';
  const isAuth = p => p.status === 'auth';
  const isLive = p => p.status === 'live';
  /* reachable, but flagged: the link still works, the provider needs a caveat */
  const isCaveat = p => isRestricted(p) || isAuth(p);
  const statusLabel = p => (isOff(p) ? 'Offline' : isRestricted(p) ? 'Restricted'
    : isAuth(p) ? 'Login issue' : 'Live');
  const hasProto = (p, key) => (p.protocol || []).includes(key);
  const hasFlag = (p, flag) => (p.flags || []).includes(flag);
  const kindLabel = p => (p.kind && p.kind !== 'unknown')
    ? String(p.kind).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  /* counts behind the hero stat chips — documented fields only */
  const live = providers.filter(isLive).length;
  const off = providers.filter(isOff).length;
  const restricted = providers.filter(isRestricted).length;
  const auth = providers.filter(isAuth).length;
  const guides = providers.filter(p => isLive(p) && !!p.guide).length;
  const noCard = providers.filter(p => isLive(p) && p.noCard === true).length;
  const credit = providers.filter(p => isLive(p) && (p.freeShape === 'signup-credit' || p.signupCredit)).length;
  const newCount = providers.filter(isNew).length;

  const stats = {
    live, off, restricted, auth, guides, noCard, credit, newCount, total: providers.length,
    chips: [
      { tone: 'green', icon: 'radio', label: `${live} live now` },
      { tone: 'accent', icon: 'sparkles', label: `${newCount} new this week` },
      { tone: 'accent', icon: 'coins', label: `${credit} signup credit` },
      { tone: 'violet', icon: 'credit-card', label: `${noCard} no card` },
      { tone: 'violet', icon: 'book-open', label: `${guides} setup guides` },
      ...(restricted ? [{ tone: 'amber', icon: 'lock', label: `${restricted} restricted` }] : []),
      ...(auth ? [{ tone: 'amber', icon: 'key-round', label: `${auth} login issues` }] : []),
      { tone: 'muted', icon: 'circle-off', label: `${off} offline` }
    ]
  };

  /* curated rows: the top picks, then the recommended set (MIA Router sits
     next to AgentRouter). Ids stay here (not in providers.js) so ordering is a
     presentation concern and every row can still be turned off by flipping status alone. */
  const PINNED = ['pixrouter', 'floodgate', 'fxqidian', 'kiosapi', 'hyxapi', 'xkiro', 'threerouter', 'foundable', 'museai', 'zcode', 'hcnsec', 'qronos', 'freemodelin'];
  const RECOMMENDED = ['agentrouter', 'miarouter', 'emtf', 'kktoken', 'seekai', 'justdowork',
    'bluesminds', 'budsai', 'flushai', 'geminiapi'];
  const byId = new Map(providers.map(p => [p.id, p]));
  const liveSorted = providers.filter(p => !isOff(p))
    .sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')) ||
      String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' }));
  const curated = new Set([...PINNED, ...RECOMMENDED]);
  /* status is the only gate: a curated row that goes dark is dropped from its
     section and reappears in the offline list at the bottom. */
  const pick = ids => ids.map(id => byId.get(id)).filter(p => p && isLive(p));

  const sections = [
    { key: 'picks', title: 'Top picks', items: pick(PINNED) },
    { key: 'recommended', title: 'Recommended', items: pick(RECOMMENDED) },
    { key: 'more', title: 'More providers', items: liveSorted.filter(p => !curated.has(p.id)) },
    { key: 'offline', title: 'Offline', items: providers.filter(isOff)
      .sort((a, b) => String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' })) }
  ];

  /* search corpus: live providers only, name + id + documented model IDs */
  const searchable = providers.filter(isLive).map(p => ({
    provider: p,
    haystack: [p.name, p.id, ...(p.models || [])].join(' ').toLowerCase()
  }));
  const modelIds = new Set(providers.filter(isLive).flatMap(p => p.models || []).map(m => m.toLowerCase()));

  /* grid order = ALL providers: live newest first, offline last */
  const featured = [...liveSorted, ...sections[3].items];

  // Optional category/authType/docsUrl fields support new provider types without
  // guessing their capabilities. The incumbent directory contains AI providers.
  const categories = p => Array.isArray(p.category) ? p.category : [p.category || 'AI'];
  const authTypes = p => {
    if (p.authType) return Array.isArray(p.authType) ? p.authType : [p.authType];
    return /\b(?:api key|key|token)\b/i.test(p.blurb || '') && /\b(?:copy|your|one|register|get)\b/i.test(p.blurb || '')
      ? ['api-key'] : ['unknown'];
  };
  const authLabel = key => ({ 'api-key': 'API Key', oauth: 'OAuth', none: 'No Auth', unknown: 'Not documented' }[key] || key);
  const docsUrl = p => p.docsUrl || p.guide || 'setup.html';
  // Optional measured/published metrics. Missing values stay unknown; no simulated telemetry.
  const metricNumber = (value, max = Infinity) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  const metrics = p => [
    { key: 'requestsPerMinute', label: 'Req/Min', value: metricNumber(p.metrics?.requestsPerMinute), unit: '' },
    { key: 'latencyMs', label: 'Latency', value: metricNumber(p.metrics?.latencyMs), unit: ' ms' },
    { key: 'uptimePercent', label: 'Uptime %', value: metricNumber(p.metrics?.uptimePercent, 100), unit: '%' }
  ].map(m => ({ ...m, display: m.value === null ? 'Not listed' : m.value.toLocaleString('en-US', { maximumFractionDigits: 2 }) + m.unit }));
  const features = p => [
    ['Authentication', authTypes(p).map(authLabel).join(', ')],
    ['Data format', p.dataFormat || 'Not documented'],
    ['Rate limit', p.rateLimit || (metrics(p)[0].value === null ? 'Not documented' : metrics(p)[0].display + ' requests/min')],
    ['Client routes', (p.protocol || []).map(key => key === 'anthropic' ? 'Anthropic' : key === 'openai' ? 'OpenAI' : key).join(' + ') || 'Not documented']
  ];
  const filters = [
    { key: 'category', title: 'API Category', options: [...new Set(providers.flatMap(categories))].sort().map(value => ({ value, label: value === 'AI' ? 'Artificial intelligence' : value })) },
    { key: 'auth', title: 'Auth Type', options: ['api-key', 'oauth', 'none', 'unknown'].map(value => ({ value, label: authLabel(value) })) },
    { key: 'status', title: 'Status', options: [{ value: 'live', label: 'Live' }, { value: 'off', label: 'Offline' }, ...(restricted ? [{ value: 'restricted', label: 'Restricted' }] : []), ...(auth ? [{ value: 'auth', label: 'Login issue' }] : [])] },
    { key: 'protocol', title: 'Client compatibility', options: [{ value: 'anthropic', label: 'Claude Code' }, { value: 'openai', label: 'Codex / OpenAI' }] }
  ];
  const filterValues = (p, key) => key === 'category' ? categories(p) : key === 'auth' ? authTypes(p) : key === 'status' ? [p.status] : p.protocol || [];
  const collections = [
    { key: 'all', title: 'All providers', items: [...sections.flatMap(s => s.items), ...providers.filter(p => !sections.some(s => s.items.includes(p)))] },
    { key: 'picks', title: 'Top picks', items: pick(PINNED) },
    { key: 'newapi', title: 'New API', items: providers.filter(p => isLive(p) && hasFlag(p, 'newapi')) },
    { key: 'recommended', title: 'Recommended', items: pick(RECOMMENDED) },
    { key: 'offline', title: 'Disabled', items: providers.filter(p => !isLive(p)) }
  ];

  window.Adapters = {
    categories, authTypes, authLabel, docsUrl, metrics, features, filters, filterValues, collections,
    providers, isNew, isOff, isRestricted, isAuth, isLive, isCaveat, statusLabel,
    hasProto, hasFlag, kindLabel, stats, featured, sections, searchable,
    modelStats: { providers: searchable.filter(s => (s.provider.models || []).length).length, ids: modelIds.size },
    esc: value => String(value == null ? '' : value)
      .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
    logo: p => p.logo || PROVIDER_FALLBACK
  };
})();
