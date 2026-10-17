/* adapters — project window.PROVIDERS into the hub's card grid.
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

  /* counts behind the hero stat chips — documented fields only */
  const live = providers.filter(p => !isOff(p)).length;
  const off = providers.length - live;
  const guides = providers.filter(p => !isOff(p) && !!p.guide).length;
  const noCard = providers.filter(p => !isOff(p) && p.noCard === true).length;
  const credit = providers.filter(p => !isOff(p) && (p.freeShape === 'signup-credit' || p.signupCredit)).length;
  const newCount = providers.filter(p => !isOff(p) && isNew(p)).length;

  const stats = {
    live, off, guides, noCard, credit, newCount, total: providers.length,
    chips: [
      { tone: 'green', icon: 'radio', label: `${live} live now` },
      { tone: 'accent', icon: 'sparkles', label: `${newCount} new this week` },
      { tone: 'accent', icon: 'coins', label: `${credit} signup credit` },
      { tone: 'violet', icon: 'credit-card', label: `${noCard} no card` },
      { tone: 'violet', icon: 'book-open', label: `${guides} setup guides` },
      { tone: 'muted', icon: 'circle-off', label: `${off} offline` }
    ]
  };

  /* grid order = ALL providers: live newest first, offline last */
  const featured = [
    ...providers.filter(p => !isOff(p))
      .sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')) ||
        String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' })),
    ...providers.filter(isOff)
      .sort((a, b) => String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' }))
  ];

  window.Adapters = {
    providers, isNew, isOff, hasProto, hasFlag, kindLabel, stats, featured,
    esc: value => String(value == null ? '' : value)
      .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
    logo: p => p.logo || PROVIDER_FALLBACK
  };
})();
