# Plan — from "setup guide site" to "provider list"

> **Build prompt.** Hand this file to a build session as the task brief. No code lives here.
> It is a plan only. The pinned visual world (dark developer-terminal, 2026-10-11) stays;
> what changes is the **surface type, the page map, and the provider row**.

---

## 0. The one-line thesis

The page is currently a **docs site that happens to contain a directory**. It should be a
**provider list that happens to have setup instructions somewhere else**. Until that
inversion happens, no amount of card polish will make people click providers.

## 1. Diagnosis — why providers are not being clicked

Measured against `js/providers.js` (46 live, 3 offline) and `js/app.js` at commit 7094620:

| Finding | Measured | Why it kills clicks |
|---|---|---|
| Cards say nothing specific | 43 of 46 live cards render the fallback chip `model list in dashboard`; only 3 carry real model data | The single row that should answer "which models do I get here" is dead weight on 93% of cards |
| Offers are near-duplicates | 27 distinct `offer` strings across 46 providers — `"Free models - sign up and start"` ×7, `"Free models - full setup guide included"` ×6, `"Free models - sign up, get a key, start chatting"` ×4 | Every card makes the same promise, so scanning decides nothing |
| Identical perk line | All 46 live cards print the same hardcoded sentence (`js/app.js:96`) | A line that appears on everything is wallpaper |
| Badge inflation | HOT on 35 of 46 live (76%), NEW on 11 (24%) | A badge on three quarters of the set is not a signal |
| No facets at all | Zero categories in the data model — no protocol, no provider kind, no free-tier shape | A user who needs "works with Claude Code, free forever, no card" cannot express that |
| Alphabetical wall | New API group, then A–Z | Everything after "A" is behind ~1.5 screens of scrolling; `ZeroCat` is last, `AgentRouter` first, for no user reason |
| Wall geometry | 49 cards in a 3-column grid at ~200px tall = ~16 rows of scroll | A 49-item set wants a list/table (Compare surface), not card tiles |
| Card is not a link | Only the bottom button and an optional guide button are anchors (`js/app.js:78-99`) | The obvious click target — the card itself — does nothing |
| The page argues instead of listing | Hero headline + lede + hero stats + a decorative terminal illustration + 8 numbered guide sections + reading progress (`index.html:79-109`, `:138-406`) | The primary content of a 49-item directory occupies section 2 of 9 on a page that reads like documentation |

**Root cause, in one sentence:** the page is composed as a **Decide/Learn** surface (hero
pitches, guide sections teach) while the user's job is **Explore + Compare** (browse 49
options, pick one, leave). Every repeated string, inflated badge, and dead model row is a
symptom of that mismatch — not the disease.

The plan does not need analytics to act on this. It does need analytics to *confirm* it (§11).

## 2. Goals

1. **A user lands on a list.** First viewport = the providers, searchable and filterable. No pitch, no illustration between the user and the options.
2. **Every row is distinguishable.** A row must answer, in one glance: what models, what kind of service, how do I get in, does it work with my client.
3. **Every row is obviously clickable** and the whole row is the target.
4. **A 49-item set is navigable in two screens**, not sixteen.
5. **Setup instructions survive**, demoted to their own page — they are the second visit, not the first impression.
6. **Honesty holds.** No invented model lists, credit amounts, or metrics. Where a fact is unknown, the row says it is unknown.

## 3. Hard constraints (unchanged)

- Static `index.html` + `css/` + `js/`; no build step, no backend, no ES modules, opens from `file://`.
- All referral/invite URLs stay **byte-identical**. This plan touches `url` values in no way.
- Offline providers stay visible, disabled, never deleted (still TaBi Token, GoRouter, Inference AI).
- Credentials in every example stay placeholders.
- Dark developer-terminal world and the existing type system stay (Space Grotesk / DM Sans / JetBrains Mono), cyan accent, static glows, **no looping animation**.

## 4. Surface reclassification (do this before any CSS)

| | Today | Target |
|---|---|---|
| Primary surface | Decide/Learn (hero, lede, guide chapters) | **Explore** (browse, filter, search a catalog) |
| Secondary surface | — | **Compare** (weigh options side by side) |
| Surface that disappears | — | Decide/Learn moves entirely to `setup.html` |

Consequences: **no hero, no marketing lede, no decorative terminal, no monument stat strip.**
A hero is correct for Decide/Learn only. A catalog leads with its controls and its rows.

Composition follows from that: a slim sticky toolbar (search + facets + count + ordering)
directly under a one-line page title, then rows. That is the whole first viewport.

## 5. New page map

```
index.html  — THE LIST (Explore + Compare)
├── 01 SLIM TOPBAR        brand · Providers(active) · Setup guides →setup.html · ⌘K
├── 02 LIST HEADER        one line: "49 free AI API providers for Claude Code & Codex"
│                         search field · facet row · result count · order control · density toggle
├── 03 STARTER PICK       optional: 3-5 hand-picked rows, visually separated, ranked by you
├── 04 THE LIST           49 rows (live first, offline trio pinned last, dimmed)
├── 05 COMPARE TRAY       appears when 2+ rows are selected (bottom sheet)
└── 06 FOOTER             minimal: link to setup.html, last-verified line

setup.html  — THE GUIDES (Decide/Learn, unchanged in spirit, moved wholesale)
└── Claude Code · Codex CLI · CC Switch · what a gateway is · security · troubleshooting · skills
```

**Deleted from `index.html`:** hero marketing block, hero terminal illustration, hero stats
strip, sidebar "On this page" rail, reading-progress box, credits/offers section, footer
provider-shortcut grid (a duplicate of the list), and the 47 guide tab panels.

Measured impact: `index.html` drops from 429 lines to roughly 120; the 47-tab Claude Code
strip (the single largest block of markup) moves to `setup.html` intact.

Keep one small honesty notice in `index.html` — the offline-provider notice — since the
offline trio is pinned in the list itself.

## 6. The list spec (core)

### 6.1 Row anatomy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [logo] AgentRouter   ● live  NEW  New API                    [ → Open sign-up ]│
│        gpt-6-astra · claude · gemini          Anthropic · OpenAI · no card    │
└──────────────────────────────────────────────────────────────────────────────┘
whole row = <a>, one tab stop, 56-64px tall
```

Rules:
- **The row is the anchor.** Logo, name, chips, models, and the right-hand CTA all live inside one `<a>`. No nested interactive elements (the guide link becomes a separate small icon button *outside* the row's anchor, or a "guide" marker that navigates).
- **Minimum 56px row height**, 12px vertical padding — the whole grid stays scannable and the hit target passes 44px comfortably.
- **Two text lines max:** line 1 = name + status + chips; line 2 = models + facets. The current 2-3 sentence `blurb` becomes the row's `title`/`aria-label` and an optional expand-on-focus detail, not visible prose in the row.
- **Right-aligned CTA** is a visual affordance, not a separate target: `Open sign-up ↗`, and for offline rows `Unavailable` with a ban icon.
- **Row hover:** 1px lift is dropped (that's card behavior); use a surface lightening + accent hairline + the CTA arrow translating 2px. Focus-visible gets the same treatment plus a real ring.

### 6.2 Ordering — replace the locked A–Z rule

Today's rule (New API group → A–Z → offline last) buries the set. Replace with a
**user-selectable order**, defaulting to one that puts the best options first:

| Order | Behaviour | Default |
|---|---|---|
| **Recommended** | Your hand-ranked order, authored in the data file (`rank: 1, 2, 3…`). Honest: it's an editorial ranking, and the page may say so. | ✅ default |
| **Newest** | `addedAt` desc, `NEW` rows float up naturally | |
| **A–Z** | Today's behaviour, kept as an option | |
| **New API first** | Today's grouping, kept as an option | |

`sortProviders()` in `js/app.js:118` is replaced by this. Offline rows stay pinned last in
every order — that rule is not negotiable (§3).

> **Honesty note:** "Recommended" must be your ranking, not an invented score. Do not
> derive it from a fabricated "uptime" or "rating". A sort control labelled "Recommended"
> with a tooltip "editor's pick, not a quality metric" is defensible; a fake 4.8★ is not.

### 6.3 Facets (the fix for "can't find one that fits me")

Single-select facet bar under the search field, with live counts on each chip (the count
plumbing already exists at `js/app.js:140`):

- `All` · `Works with Claude Code` · `Works with Codex` · `New API` · `No card needed` · `Has setup guide` · `Unavailable`

This **replaces** `All / New API / HOT / NEW / Unavailable`. Specifically:

- **HOT is deleted.** At 76% prevalence it is noise. If you want a "top pick" flag it must be capped (≤8 rows) and curated by you, not sprayed.
- **NEW survives** but gets a rule, not a vibe: `addedAt` within 30 days, computed at render, so it decays on its own.
- New facets derive from new data fields (§7): `protocol[]`, `freeShape`.

### 6.4 Search — make it the primary control

The search field is the top-left element of the first viewport, not inside a hero.
Behaviour to keep: hero/directory/⌘K tri-sync (`js/app.js:163`) — collapse to **one** field
plus the ⌘K overlay on the list page. Add:

- `/` focuses search (and `Esc` clears) — the convention for list surfaces.
- Search matches name, models, protocol, and kind — same token logic that exists at `js/app.js:126`.
- **The model-data gap is the search's ceiling:** with 43 rows lacking models, typing "gpt" surfaces almost nothing. Fixing that is a data task (§7), not a code task.

### 6.5 Density toggle and compare

- **List (default)** — rows as above; ~14 visible per screen.
- **Compact** — logo + name + models only, ~26 per screen, for users who already know what they want.
- **Cards** — the current 3-column card grid, kept as an option for people who like it. The existing `cardMarkup()` is reused here, minus the dead model row and the repeated perk line.

**Compare tray:** a checkbox column (or `c` key) selects up to 4 rows; a bottom sheet then
aligns them field-by-field (models, protocol, kind, free shape, guide?). This is the
Compare surface — the honest way to help someone choose without inventing rankings. Zero
data collection required.

### 6.6 State and keyboard

- Facet + order + density + search persist in `localStorage` (the pattern already exists at `js/app.js:47`). Returning users resume where they were.
- `j`/`k` or arrows move row focus, `Enter` opens, `/` search, `c` compare, `⌘K`/`Ctrl+K` overlay, `Esc` clears.
- Offline rows are focusable but not activatable, and announce "Unavailable".

## 7. Data model additions (the real blocker)

The list cannot become informative without fields that do not exist yet. Extend each entry in
`js/providers.js`:

```js
{
  id: "agentrouter",
  name: "AgentRouter",
  url: "https://agentrouter.org/register?aff=1TUW",   // untouched, verbatim
  logo: "assets/gorouterlogo.png",
  status: "live",                  // "live" | "off"          [exists]
  flags: ["newapi"],               // "newapi" | "hot"(retired) | "new"(derived)  [narrowed]
  addedAt: "2026-10-02",           // NEW: drives NEW badge + Newest order
  rank: 3,                         // NEW: drives Recommended order (editorial, yours)
  kind: "newapi-gateway",          // NEW: "newapi-gateway" | "aggregator" | "relay" | "invite-only" | "terminal-agent"
  protocol: ["anthropic","openai"],// NEW: powers the "Works with Claude Code / Codex" facets
  models: ["gpt-6-astra"],         // NEW (mostly empty today): documented model IDs only
  freeShape: "signup-credit",      // NEW: "signup-credit" | "free-tier" | "invite-bonus" | "unknown"
  noCard: true,                    // NEW: honest boolean, or omitted if unknown
  blurb: "…",                      // unchanged; now the row's expand/tooltip text
  offer: "…",                      // unchanged; shown on expand, not in the row
  guide: null                      // remains; renders a "Setup guide" marker linking to setup.html#<id>
}
```

**Collection rules — non-negotiable:**
- Every field is filled from the provider's own dashboard/docs, or left `"unknown"`.
- Unknown renders as an explicit muted `unknown` chip, never as a plausible guess.
- `models: []` is preferable to an invented model name. 43 rows may stay unknown on day one; that is acceptable and honest.
- Confirm each referral URL still resolves while collecting (they rot fast); flip `status: "off"` rather than deleting.

**Dead-weight removal:** with real model data, the `model list in dashboard` fallback chip
(`js/app.js:75`) largely disappears; keep it only for rows still marked unknown.

## 8. Visual and theme deltas

Keep: `#070b14` ground, indigo surfaces, cyan accent, violet structure, the 1px hairlines,
static glows, Blinking caret nowhere (the hero terminal that used it is deleted).

Change:
- **Row-centric rhythm** replaces card-grid rhythm: hairline separators or 8px gaps between rows, one table-like alignment so models line up in a column across rows (that alignment *is* the Compare surface).
- **Typography does the hierarchy.** Name at 15px/600 in Space Grotesk; models at 11px JetBrains Mono in a fixed-width column; facets at 10px uppercase mono. No boxes, no icon toppers.
- **Kill the monument stat strip** (`49 / 46 / 11 / 3` at `index.html:88-92`) — those numbers belong in the one-line header as prose, not as four big numerals filling space.
- **Logo tiles stay** (light tile, `--logo-tile`) — they are the fastest scan anchor and the New API cluster reads off them.
- **Density:** the current page uses `padding:64px` per section; the list page should use one 12-16px vertical rhythm in the rows and ~28px between the toolbar and the list.

## 9. What gets deleted, moved, or collapsed (explicit inventory)

| Item | Today | Action |
|---|---|---|
| Hero h1 + lede + CTAs | `index.html:79-97` | Delete. Title becomes a one-line header above the list |
| Hero terminal illustration | `index.html:98-108` | Delete from list page (optional small reuse on `setup.html`) |
| Hero stats strip | `index.html:88-92` | Delete (hardcoded `49`/`3` there are already a falsehood risk) |
| Sidebar rail + reading progress | `index.html:58-76`, `js/app.js:40-58` | Delete — the page is no longer a long document |
| Provider directory section | `index.html:113-138` | Becomes the page |
| Offline notice (warn) | `index.html:140` | Keep, shorten |
| Gateway explainer + endpoint row | `index.html:142-167` | Move to `setup.html` |
| Claude Code tabs (47 panels) | `index.html:169-336` | Move wholesale to `setup.html` |
| Codex / CC Switch / Security / Troubleshooting / Skills | `index.html:338-406` | Move to `setup.html` |
| Credits & offers section | `index.html:369-375` | Delete — offer text folds into the row's expand state; `offer` data stays |
| Provider footer shortcut grid | `index.html:408-411`, `js/app.js:201-210` | Delete — it is a second copy of the list |
| `HOT` badge | `css/style.css:384`, `app.js:66` | Retire (76% prevalence) |

Dead CSS that this rework should also clear (found in the last audit, still present):
`.comparison-table`, `.comparison-wrap`, `.row-off` (no HTML/JS reference at all),
`.hero-body` (declared twice, second one `display:none`).

CSS defect to fix while in there: `.provider-card h3` is declared at `css/style.css:211`
(17px) **and** `:232` (20px, `margin:21px 0 8px`) — the later rule wins, so compact cards
render at 20px with a 21px top margin. Same story for `.provider-card p` (`:212` 12.5px
margin `11px 0 0` vs `:233` 13px `margin:0`, which erases the paragraph gap). If the card
density view survives (§6.5), these must be resolved.

## 10. Responsive and accessibility floor

- **Mobile** is where a list earns its keep: rows stack to two lines, the models column collapses under the name, facets become a horizontally scrollable chip row pinned under the search field, CTA stays a full-width tap target at the row's right edge.
- Breakpoints stay 1440 / 1050 / 820 / 580 / 380.
- One tab stop per row; visible focus ring; `aria-pressed` on facets; count readout in `aria-live="polite"` (exists at `index.html:129`).
- Offline rows: `aria-disabled`, and state the reason in text — never colour alone.
- Facet chips must meet 4.5:1 on the dark ground; the retired HOT chip is the current offender.
- `prefers-reduced-motion` disables row transitions and the reveal stagger (`app.js:149-161` keeps working, or drop it entirely — a list does not need scroll reveal).

## 11. Open decisions (defaults chosen — override any of these)

| Decision | Default | Alternative |
|---|---|---|
| Guides on the same page or separate? | **Separate `setup.html`** (file://-safe, keeps `index.html` pure) | Collapsed `<details>` block at the bottom of index.html |
| How many providers in the "starter pick" block? | **5, hand-ranked by you** | None — one flat list |
| `HOT` | **Retire** | Keep but cap at ≤8 curated rows |
| Default density | **List** | Compact |
| Default order | **Recommended (your ranking)** | A–Z |
| Compare tray | **Yes** (up to 4) | Skip for v1 |
| Card grid | **Keep as a density option** | Delete entirely |
| Measuring "not clicked" | **Add nothing** (site has no analytics by constraint) | Optional local-only click counter in `localStorage`, no network; or user adds a privacy-light script later |
| Model data | **Collect for the top ~15 recommended rows first**, `unknown` elsewhere | Collect all 49 before shipping (slower, more honest across the board) |

> The last row matters most. The list is only as good as its data. A plan that ships the new
> layout with the same 43 unknown model rows produces a prettier list that users still
> cannot choose from. Recommend: ship layout + `kind`/`protocol`/`addedAt` for all 49 (those
> are cheap — visible on most sign-up pages), and real `models` for the recommended set.

## 12. Build phases

1. **Data pass** — extend `js/providers.js`: `addedAt`, `rank`, `kind`, `protocol`, `freeShape`, `noCard`; fill real `models` for the recommended set; retire `hot`; de-duplicate the repeated `guide` keys (aerolink, artbloom, omnirush, onomeo, tokenforge each declare `guide` twice).
2. **Split the pages** — create `setup.html`, move guide sections + tab strip + sidebar/reading-progress concept there; strip `index.html` down to topbar + list.
3. **Row component** — replace `cardMarkup()` with `rowMarkup()`: one anchor per row, two text lines, models column, facet chips, right-aligned CTA, offline state.
4. **Controls** — search (single field + `/`), facet bar with counts, ordering select, density toggle, result count.
5. **Compare + state** — selection tray, `localStorage` persistence, keyboard map.
6. **Style pass** — row rhythm, alignment column, delete card-grid-era dead CSS and the two `.provider-card` override conflicts, retire HOT chip styling.
7. **QA** — see §13.

## 13. Acceptance criteria

- [ ] First viewport contains search + facets + provider rows. No hero, no terminal illustration, no stat strip.
- [ ] Every one of the 49 rows is a single keyboard-reachable link; clicking anywhere in the row opens the provider.
- [ ] Typing `claude` surfaces every provider whose `protocol` includes anthropic; `gpt` surfaces every row with a documented GPT model.
- [ ] Facet counts match filtered results for every facet.
- [ ] `NEW` derives from `addedAt` (≤30 days) and decays without a code edit.
- [ ] No `HOT` badge anywhere.
- [ ] Offline trio pinned last in all sort modes, disabled, reason in text, `inference` never linked.
- [ ] Every referral URL byte-identical to today (diff the data file before/after).
- [ ] No field invents a value: unknown renders as `unknown`.
- [ ] `index.html` opens from `file://` with zero console errors; `setup.html` too.
- [ ] Desktop 1440/1280, tablet 820, mobile 580/380 clean; reduced-motion honoured; no looping animation.
- [ ] Filters/order/density survive a reload.
- [ ] `index.html` is a fraction of its current 429 lines, and no guide content was lost — it all exists in `setup.html`.

## 14. Never do

- No invented model lists, credit amounts, ratings, uptime, or testimonials. No fake "Recommended" score.
- No analytics, backend, build step, or ES modules.
- No deleting offline providers or their history.
- No editing, "cleaning", or trimming a referral URL.
- No looping/shimmer/flame animation (pinned direction).
- No keeping a hero on an Explore surface "for brand warmth" — that is the disease this plan treats.
