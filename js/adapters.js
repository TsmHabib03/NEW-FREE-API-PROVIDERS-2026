/* adapters — project window.PROVIDERS into the hub's card grid.
   Rules (unchanged): everything here is DERIVED from documented fields only.
   No fabricated quota / uptime / latency numbers anywhere. */
(() => {
  const providers = window.PROVIDERS || [];
  const PROVIDER_FALLBACK = 'assets/gorouterlogo.png';

  const isNew = p => p.status === 'live' && !!p.addedAt &&
    (Date.now() - new Date(`${p.addedAt}T00:00:00`).getTime()) / 864e5 <= 7;
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

  /* grid order = ALL providers: live newest first, offline last */
  const featured = [
    ...providers.filter(p => !isOff(p))
      .sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')) ||
        String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' })),
    ...providers.filter(isOff)
      .sort((a, b) => String(a.name).replace(/\s+AI$/i, '').localeCompare(String(b.name).replace(/\s+AI$/i, ''), undefined, { sensitivity: 'base' }))
  ];

  window.Adapters = {
    providers, isNew, isOff, isRestricted, isAuth, isLive, isCaveat, statusLabel,
    hasProto, hasFlag, kindLabel, stats, featured,
    esc: value => String(value == null ? '' : value)
      .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
    logo: p => p.logo || PROVIDER_FALLBACK
  };
})();
