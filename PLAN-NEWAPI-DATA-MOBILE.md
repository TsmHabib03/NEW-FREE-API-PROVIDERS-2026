# Plan — New API provider data pass + responsive fix

> Build brief. Two independent workstreams, one branch. No invented facts anywhere:
> every collected value comes off the provider's own page; anything not published stays `unknown`.

---

## Scope decision (assumption, flagged)

"NEW API providers" is read as **the providers carrying the `newapi` flag** — the group the
site already labels with the `New API` chip and the "New API first" sort. That is **8 entries**
in `js/providers.js`:

| id | name | url host |
|---|---|---|
| agentrouter | AgentRouter | agentrouter.org |
| bluesminds | Bluesminds | api.bluesminds.com |
| emtf | EMTF AI | emtf.aipm9527.online |
| freemodel | freemodel | freemodel.dev |
| geminiapi | gemini-api | gemini-api.online |
| justdowork | JustDoWork | api.justwoker.icu |
| kktoken | KKToken | kktoken.cc |
| seekai | SeekAI | seekai.cc |

All 8 are `models: []` today — the exact gap this pass fills.

*If "NEW API" meant the `NEW` badge (last 7 days: TokenLayer, UTIM, Codex-Relay, MarsAI,
Odyssey, UnoRouter, Bearlab, Ireze, freemodel.in), the same procedure extends to those 9 —
say the word and it is a second run of the identical loop.*

---

## Workstream A — collect what each New API provider offers

**Goal:** fill `models`, `blurb`, and the category fields (`kind`, `protocol`, `freeShape`,
`noCard`, `inviteOnly`) from each provider's own pages.

**Method (browser, per provider):**

1. Navigate to the referral URL verbatim. Never type anything into a sign-up form; never
   create an account. Read-only.
2. Capture the home/sign-up copy (the short description source) and any visible model list.
3. Probe the instance's own public endpoints, in order, until one answers:
   - `GET /api/pricing` — the New API pricing payload; lists model names + ratios.
   - `GET /api/models` — OpenAI-style model array.
   - `GET /api/status` — instance health (cheap liveness check).
   Read them from inside the loaded origin so CORS cannot lie about reachability.
4. Record per-provider evidence to `.impeccable/newapi-evidence-<date>.json`:
   `{ id, url, reachable, modelsFound, modelSource, homeCopy, protocol[], freeShape, noCard }`.

**Rules (non-negotiable, from PRODUCT.md + PROVIDER-LIST-PLAN.md §7):**

- A model ID lands in `models[]` only if it appears on the provider's own page or API. No
  inference from a marketing name, no "probably gpt-5".
- `reachable: false` → do **not** flip `status`. Liveness ≠ sign-up validity; flag it in the
  report for the human to decide.
- `blurb` stays a short factual sentence: what the gateway is + the sign-up flow. Two clauses.
- Categories are read off evidence: `protocol` only when the provider documents a route
  (`/v1/messages`, `/v1/chat/completions`, `ANTHROPIC_BASE_URL`) or says OpenAI-compatible;
  `freeShape` only from the offer wording; `noCard` only from "no card" wording.
- Referral URLs are never touched by this pass.

**Output:** updated `js/providers.js` (8 entries) + evidence JSON. Nothing else changes shape.

---

## Workstream B — responsive fix, all screen types

**Goal:** no horizontal overflow, no clipped controls, no sub-44px tap target on the row's
primary action, at every width from 320 to 1920.

**Measured first, not guessed.** The audit is scripted in the browser against the real files:

- widths: **320, 360, 380, 414, 480, 580, 700, 768, 820, 1024, 1050, 1280, 1440, 1920**
- per width, for `index.html` **and** `setup.html`:
  - `document.documentElement.scrollWidth > innerWidth + 1` → horizontal overflow
  - every element whose `getBoundingClientRect().right > innerWidth + 1` → the offender
  - every `button/a/select/input` with rendered `height < 44` **or** `width < 44` in the
    row / toolbar / compare surfaces
  - `.prow-cta`, `.list-toolbar`, `.filter-row`, `.density-control`, `.cmp-bar` geometry
- both densities (`list`, `compact`, `cards`) are exercised, since they have different grids.

**Known suspects from reading `css/style.css` (to confirm by measurement, not to assume):**

| # | Suspect | Where |
|---|---|---|
| 1 | `.prow-link` third column fixed `156px` / `138px` squeezes the name column on small tablets | `style.css:169,376` |
| 2 | `.list-toolbar` wraps the search 320px basis + order + density into a ragged stack under 700px | `:128-144` |
| 3 | `.filter-row` at 580 turns into a nowrap scroll strip with no affordance or scroll padding | `:415` |
| 4 | `.cmp-table{min-width:520px}` inside `.cmp-sheet` — the sheet itself needs its own scroll containment on mobile | `:237,399` |
| 5 | `.prow-pick` is `tabindex="-1"` and ~22px — acceptable for mouse, invisible on touch; the compare affordance may be unreachable on phones | `:165`, `app.js:161` |
| 6 | `.list-sticky` goes `position:static` at 820 but the topbar stays sticky — fine, verify no double-stick jump | `:390` |
| 7 | Badge row (`.prow-top`) wraps to 3 lines on 320px and pushes the row tall | `:174` |
| 8 | `.toast` / `.cmp-bar` bottom offsets collide on small screens | `:247,426` |

**Fix approach:** repairs land in `css/style.css` responsive blocks only — plus, if the
measurement demands it, a small `app.js` change for the compare affordance on touch. No
structural rewrite, no new breakpoints unless a measured failure has no home in an existing one.

**Acceptance (must be evidenced by the audit script's second run):**

- [ ] zero horizontal overflow at all 14 widths, both pages, all three densities
- [ ] row primary action ≥44px tall at ≤580px
- [ ] compare selection reachable on touch (or the tray is documented as desktop-only)
- [ ] `prefers-reduced-motion` still honoured; no looping animation introduced
- [ ] `index.html` + `setup.html` open from `file://` with zero console errors

---

## Phases

1. **Plan** — this file. ✔
2. **Recon** — one provider end to end to learn the instance shape (which endpoint answers).
3. **Collect** — loop all 8, append evidence JSON per provider to the workspace file.
4. **Audit** — responsive measurement script, both pages, all widths → findings JSON.
5. **Fix A** — rewrite the 8 `providers.js` entries from evidence.
6. **Fix B** — responsive repairs in `style.css` (+ `app.js` if required).
7. **Verify** — re-run the audit; diff referral URLs before/after (must be byte-identical);
   re-run the provider loop for the two entries that changed most.
8. **Report** — what changed, what stays `unknown` and why, what remains unverifiable.

## Never do

- No invented model IDs, credit amounts, ratings, or uptime.
- No editing a referral URL, ever, for any reason.
- No account creation, no form submission, no credential entry in the browser.
- No deleting or re-flagging offline providers.
- No analytics, no build step, no ES modules.
