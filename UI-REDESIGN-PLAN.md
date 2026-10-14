# UI Redesign Plan — "Credits 2026" Provider Command Deck

> **Build prompt.** Hand this file to a build session as the task brief. No code lives here — this is the contract for the revamp. The pinned visual world (dark developer-terminal, chosen 2026-10-11) stays; the **layout, information architecture, and provider directory are rebuilt from zero.**

---

## 1. Project understanding (what must stay true)

- **What it is:** a static, single-page directory of free/credit AI API gateway providers + setup guides for Claude Code, Codex CLI, and CC Switch. No build step, no backend, no analytics. Files: `index.html`, `css/style.css`, `js/app.js`, logos in `assets/`.
- **Who it serves:** CLI developers hunting for a provider that works *today*, then configuring it in minutes.
- **Hard constraints:**
  - Every sign-up link carries a referral/invite code — **preserve URLs verbatim**, character for character.
  - Honesty rule: no invented claims (no fake credit amounts, model lists, or stats). Descriptions may only state what the provider documents.
  - Offline providers stay visible but disabled — never deleted.
  - All credentials in code examples stay placeholders.
  - Site must still work opened directly via `file://` (no ES modules, no fetch of local JSON).

## 2. Goals

1. **Directory-first experience:** the provider list is the product. A visitor finds a working provider in seconds — search, sort, scan.
2. **Compact, modern revamp:** tighter hero, denser cards, one visual language from directory to terminal.
3. **Richer provider intelligence:** per-provider description, accessible AI models, badge effects (NEW / HOT / New API), and a clear affiliate perk line — *"sign up through this link to earn bonus credit."*
4. **Ordered by value:** all **New API** providers first (the ones running the New API platform, favicon + chip), then the remaining providers in **alphabetical order**.
5. **Inference AI disabled** everywhere (no longer accessible) — same treatment as TaBi Token and GoRouter.

## 3. Assumptions (redirect me if wrong)

- The dark developer-terminal world stays (it was pinned by you earlier today); this revamp rebuilds **layout and structure** inside that world, evolving the theme rather than replacing it.
- Type system stays: **Space Grotesk** (display), **DM Sans** (prose), **JetBrains Mono** (code/data/badges).
- The old "Quick access" CTA button grid (~43 big duplicate buttons) is **merged into the new unified directory** — one source of truth instead of five copies of every provider.
- Model lists use what is documented today (e.g. AgentRouter → GPT 6 Astra, freemodel.in → 31 models) and fall back to a generic chip (`see dashboard for model list`) where unknown. You can supply exact lists later — the data file makes that a one-line edit.

## 4. New information architecture (complete layout rebuild)

**New page map, top to bottom:**

```
┌──────────────────────────────────────────────────┐
│ 01 TOPBAR (sticky, slimmer 56px)                  │
│    brand · Providers · Guides · Troubleshoot      │
│    ⌘K search pill · Get started CTA               │
├──────────────────────────────────────────────────┤
│ 02 HERO (compact, ~2 viewport-thirds)             │
│    headline + one-line lede                       │
│    ★ LIVE PROVIDER SEARCH BAR (the centerpiece)   │
│    stats strip: N providers · N live · N new      │
│    mini terminal visual (right, smaller)          │
├──────────────────────────────────────────────────┤
│ 03 PROVIDER DIRECTORY (the star of the page)      │
│    toolbar: filter chips + sort toggle + count    │
│    search-synced, badge-rich provider cards       │
│    NEW API group first → A–Z for the rest         │
│    unavailable providers pinned at the end, dimmed│
├──────────────────────────────────────────────────┤
│ 04–09 GUIDE SECTIONS (console panels)             │
│    gateway explainer · Claude Code tabs · Codex   │
│    CC Switch · credits & offers table · security  │
│    troubleshooting · skills                       │
├──────────────────────────────────────────────────┤
│ 10 PROVIDER SHORTCUTS (footer row, derived)       │
│ 11 FOOTER                                         │
└──────────────────────────────────────────────────┘
```

- **Sidebar:** keep the "On this page" rail + reading progress on desktop; it already works and fits the world.
- **Hero:** cut from ~550px to a compact band. The live search input *is* the primary CTA — typing here scrolls to + filters the directory. Keep dual guide CTAs as secondary buttons.
- **Pacing:** dense directory earns the quiet guide sections after it; one spacing rhythm, more space above headings than below.

## 5. The provider directory (core spec)

### 5.1 Sorting — locked rule

1. **Group 1 — New API providers** (running the New API platform): first, alphabetical within the group, each showing the New API chip.
2. **Group 2 — every other live provider:** alphabetical (A–Z), case-insensitive, ignoring "AI" suffix noise.
3. **Group 3 — unavailable providers** (TaBi Token, GoRouter, **Inference AI**): pinned at the end, dimmed, links disabled, notice visible.

### 5.2 Search & filters

- **Directory search field** synced with the hero search and the `Ctrl/Cmd+K` overlay: matches provider **name, description, models, and badges** (typing "gpt" surfaces every provider listing a GPT model).
- Filter chips: `All` · `New API` · `HOT` · `NEW` · `Unavailable` — single-select, count badges on each chip.
- Live count readout: "41 providers · 12 shown".
- Empty state: "No providers match — try claude, gpt, relay, or clear filters."

### 5.3 Card anatomy (compact, information-dense)

```
┌────────────────────────────────────────────┐
│ [logo] ProviderName  [NEW] [HOT] [New API] │
│ ● Live                                      │
│ 2-line richer description (what it offers, │
│ sign-up flow, compatibility)               │
│ ┌────────────────────────────────────────┐ │
│ │ MODELS: gpt-6-astra · claude · …       │ │
│ └────────────────────────────────────────┘ │
│ ★ Bonus credit when you sign up via link   │
│ [ → Sign up & earn credit ]  [ guide ↗ ]   │
└────────────────────────────────────────────┘
```

- **Logo tile:** provider favicon in a light tile (existing pattern) — the "NEW API favicon" group makes the visual cluster legible.
- **Badges (effects, all static glow — no looping animation, per pinned direction):**
  - `HOT` — amber→orange gradient chip, warm static glow.
  - `NEW` — cyan→green gradient chip, cool static glow.
  - `New API` — violet outline chip, mono type.
  - `Unavailable` — muted red chip, card dimmed to ~55% opacity, ban icon.
  - A provider can stack NEW + New API; cap at two flags per name row for scannability.
- **Models row:** mono chips, hairline borders, max ~6 + `+N more`. Only documented model names; fallback single chip `model list in dashboard`.
- **Perk line (affiliate):** small star icon + "Bonus credit when you sign up through this link." Present on every live referral provider; honest wording, no invented amounts. This is the affiliate messaging made explicit but not shouty.
- **Card hover:** border glow in the provider's accent, 1px lift, arrow slides. Focus-visible ring for keyboard users.

### 5.4 Inference AI — disable (7 locations in current HTML)

| # | Location (approx. line) | Action |
|---|---|---|
| 1 | CTA grid `provider-cta-button` (L123) | Remove / convert to disabled |
| 2 | Provider card + buttons (L286–289) | Card → `is-disabled`, "Unavailable", links dead, keep logo |
| 3 | Credits table row (L511) | Mark "Unavailable — service offline" |
| 4 | Claude Code tab button (L588) | `disabled` state + Unavailable chip |
| 5 | Claude Code tab panel (L656) | Replace with offline notice (TaBi/GoRouter pattern) |
| 6 | Offer row (L822) | Disabled row |
| 7 | Footer shortcut (L876) | Disabled |
| 8 | Provider notice (L157) | Add Inference AI to the offline list + alternatives |

Once the directory is data-driven, its status comes from the data file — flipping `status: "off"` handles the directory copy automatically; the hardcoded guide-section spots get one-time edits.

## 6. Data-driven rendering (the architecture change)

New **`js/providers.js`** — classic script (file:// safe), no modules:

```js
window.PROVIDERS = [
  {
    id: "agentrouter",
    name: "AgentRouter",
    url: "https://agentrouter.org/register?aff=1TUW",   // verbatim referral link
    logo: "assets/gorouterlogo.png",
    status: "live",            // "live" | "off"
    flags: ["new-api", "hot"],
    models: ["gpt-6-astra"],   // documented only
    blurb: "GPT 6 Astra runs free of charge. Create an account, copy the key from the dashboard, and send your first request in minutes.",
    guide: null                 // or URL to the setup guide
  },
  // … 42 more
];
```

- `app.js` renders the directory grid, applies sort/filter/search, updates counts, and emits the footer shortcut row from the same data — **one source of truth, five fewer places to update a provider.**
- Guide tab sections stay in `index.html` (they're prose-heavy), but the **tab strip order** regenerates to match the directory sort; Inference's tab renders disabled from data.
- Ctrl+K overlay indexes both sections and providers.

## 7. Theme & effects spec (evolved dark-terminal)

- **Keep:** space-black `#070b14` ground, indigo layered surfaces, cyan live accent, violet structure marks, terminal-green success, glass panels + 1px hairlines.
- **Refine for "compact modern":**
  - Reduce section paddings ~20%; tighter card grid (3-col desktop → 2-col → 1-col mobile; keep breakpoints 1440/1050/820/580/380).
  - Slimmer topbar (56px) with the ⌘K pill inline.
  - Directory cards ~2 lines of description — denser than today's tall cards.
- **Effects (all static or one-shot, honoring the "no constant shimmer" pin):**
  - Static gradient glows on HOT/NEW chips.
  - One-shot scroll-reveal on directory cards (staggered, `IntersectionObserver`, respects `prefers-reduced-motion`).
  - Blinking caret stays in the hero terminal only.
  - Search pill focus: cyan ring + soft glow field.

## 8. Descriptions — the rewrite pass

Every live provider gets a 2-line description built from three honest moves:

1. **What it is** (gateway/relay/one-key aggregator) and compatibility (Anthropic-style / OpenAI-compatible).
2. **The sign-up flow** ("register → copy key from dashboard → first request in minutes").
3. **The perk** lands as the star line under the card (bonus credit via referral link).

Model chips answer "which AI models can I access here" at a glance.

## 9. Responsive & accessibility floor

- Mobile: single-column cards, sticky filter chip row, search stays reachable; mobile panel nav unchanged behavior.
- Keyboard: card is a single focusable link; badges are text (not color-only); filter chips are real buttons with `aria-pressed`.
- Contrast: badges meet 4.5:1 on dark ground; dimmed unavailable cards keep readable text.
- `prefers-reduced-motion` disables reveal stagger and caret.

## 10. Out of scope / never do

- No backend, no build step, no analytics, no ES modules.
- No invented credit amounts, model lists, stats, or testimonials.
- No deleting offline providers or their history.
- No looping/shimmer/flame animations (pinned).
- Referral URLs never edited, "cleaned", or trimmed.

## 11. Build phases

1. **Data layer:** author `js/providers.js` with all 43 providers (links verbatim), sort rule, Inference AI `status:"off"`.
2. **Directory render:** new compact card component + toolbar (search, filter chips, sort toggle, counts) in `app.js`.
3. **Layout rebuild:** hero compaction (search-first), merge/remove old CTA grid, reflow sections per §4.
4. **Guide sections:** reorder tab strip, disable Inference tab + panel, update credits table + notices.
5. **Theme pass:** badge glows, hover states, reveal stagger, spacing tightening in `style.css`.
6. **QA:** search/filter behavior, all 7 Inference spots, referral URL diff (before vs. after must be byte-identical), responsive sweep 1440→380, reduced-motion, file:// open.

## 12. Acceptance criteria

- [ ] Typing in hero search filters the live directory; ⌘K finds providers by name/model.
- [ ] New API group renders first, then A–Z; unavailable trio pinned last.
- [ ] Every live card shows badges, models row, and the bonus-credit perk line.
- [ ] Inference AI: zero live links, visible-but-disabled everywhere, notice updated.
- [ ] All referral URLs byte-identical to today (diffed).
- [ ] Page opens from `file://` with zero console errors.
- [ ] Desktop 1440/1280, tablet 820, mobile 580/380 all clean; reduced-motion honored.
- [ ] No looping animations anywhere; glows are static.

## 13. Open decisions (defaults chosen, flag to override)

| Decision | Default | Alternative |
|---|---|---|
| Visual world | Keep pinned dark-terminal | Fresh palette swap (bigger change) |
| Model chips where unknown | `model list in dashboard` chip | You supply exact lists |
| Old CTA "Quick access" grid | Merged into directory | Keep as separate compact row |
| Hero terminal visual | Keep, smaller | Drop for pure search hero |
