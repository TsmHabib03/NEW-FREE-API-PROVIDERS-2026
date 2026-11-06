# Community Awareness Notice — implementation plan

Status: planning only. No application changes, commit, push, or deployment are part of this deliverable. The request contains both a plan-only stopping instruction and a final request to deploy/push; implementation scope must be resolved before those actions.

Target: https://new-free-api-providers-2026.vercel.app/

Design method: Impeccable `shape`, extending the established directory interface. The notice is a Read surface: visitors understand the directory's position, then continue discovering providers.

## 1. Architecture assessment and inspection evidence

- The homepage is a static HTML/CSS/JavaScript application, not React, Next.js, or a server-rendered application. `index.html` loads `css/directory.css` and, in order, `js/icons.js`, `js/providers.js`, `js/adapters.js`, `js/views.js`, and `js/theme.js`.
- `js/providers.js` holds provider records and referral/sign-up URLs. `js/adapters.js` supplies directory metadata and filter behavior. Neither requires modification for this feature.
- `js/views.js` owns search, collections, sorting, provider details, the nested MuseAI guide, mobile filters, global click/keyboard handling, focus restoration, background inertness, and body scroll locking. Extend this controller rather than introducing a second independent dialog manager.
- Existing overlays are static markup with `hidden`, `role="dialog"`, and `aria-modal="true"`. Provider details use `data-prov-modal`; the nested guide uses `data-guide-modal`. Their appearance is provider-specific, so reuse interaction infrastructure and shared primitives rather than injecting notice text into provider details.
- Homepage navigation uses ordinary links to `#main-content` and `setup.html`. `js/router.js` exists but is not loaded by the homepage. This feature does not need that legacy router or a new route.
- The existing persistence mechanism is guarded localStorage access for `aip2026.theme`, including a pre-paint theme read. The notice can follow the guarded access pattern with its own key.
- The active design system uses DM Sans, light/dark custom properties, blue actions, white/dark surfaces, muted text, 44px icon controls, and visible focus outlines. CSS is hand-authored. Tailwind is a legacy development dependency; `build:css` does not compile `css/directory.css`.
- The existing design documentation describes rounded, decorative provider dialogs. The current task explicitly requires sharp rectangular components. Apply that geometry to the notice alone while retaining the existing font, colors, spacing rhythm, and theme behavior.
- Vercel serves the deployed static site. No tracked Vercel configuration or deployment workflow was found. The GitHub remote is `TsmHabib03/NEW-FREE-API-PROVIDERS-2026`, and the current branch is `main`; a production deployment trigger cannot be inferred from that alone.

Inspection on November 6, 2026: deployed `index.html`, `css/directory.css`, `js/views.js`, and `js/theme.js` returned HTTP 200 and matched the local files after newline normalization. All eight baseline `npm test` checks passed. Browser access was unavailable, so actual rendering, focus, screen-reader behavior, and mobile overflow remain unverified. Existing old screenshots are not current visual evidence.

`PRODUCT.md` contains older architecture/branding details; the current entry point, deployed source, and `DESIGN.md` establish the incumbent implementation for this plan. Updating unrelated product documentation is outside this feature.

## 2. Recommended design and component structure

Use a dedicated, static Community Awareness Notice dialog placed outside `data-directory-shell`, beside the existing overlays. Keeping it outside the shell allows background content to become inert without making the notice itself inert.

Conceptual structure:

- Notice overlay: neutral translucent dimming, shared positioning conventions, and dedicated notice hooks.
- Notice panel: solid theme-aware surface, square corners, a restrained one-pixel separator/border, and modest shadow.
- Header: title on the left and a 44px close control on the right.
- Reading area: five left-aligned paragraphs, no content truncation or decorative badges.
- Action row: filled primary `Acknowledge & Continue` button followed by secondary `Browse Directory` button.
- Reopen control: a persistent text button labeled `Community notice` near the directory introduction, visible before the provider grid on desktop and mobile. Avoid expanding the already constrained top navigation. It must remain available after any dismissal.

Desktop target: approximately 640px maximum panel width, 32px internal padding, a 26–28px title, and 16px body text with approximately 1.65 line height. Keep the reading measure around 60 characters per line. Both actions sit side by side where their full labels fit.

Mobile target: 12–16px outer clearance plus device safe-area insets, 20px panel padding, a 22–24px title, unchanged 16px body text, and stacked full-width actions. Use the existing 730px and 490px breakpoints where useful, but wrap according to the actual content width.

Use `--surface`, `--ink`, `--muted`, `--line`, `--accent`, and `--accent-hover`. Scope corner, spacing, and animation overrides to notice classes. Do not reuse the provider hero, floating logo, colored gradient, pill actions, or provider warning styling for this text notice. Reuse shared button/icon/focus conventions with square-corner notice variants. No new imagery, fonts, animation, or runtime dependencies are needed.

### Proposed public copy

Title: **Community Awareness Notice**

We are aware of recent allegations circulating within the developer community regarding several AI API providers listed on this website.

We respect honest feedback and legitimate warnings. However, claims of scams or fake models should be supported by verifiable technical evidence, not assumptions or personal experiences alone.

FREE-API-PROVIDERS is an independent directory for discovering free and free-tier AI APIs. We do not own, operate, or guarantee the services listed.

We also encourage visitors to evaluate promotional recommendations and referral links independently.

Our commitment remains transparency, reliable information, and helping developers discover useful AI resources.

Use the supplied wording as the implementation baseline. No original Discord message or API traces were inspected in this task; do not add a claim that the allegations have been investigated or disproven. Do not identify the Discord user, repeat specific provider accusations, reproduce screenshots, link the personal referral, encourage reporting, or add verification badges. The existing provider and referral records remain unchanged.

## 3. Files to modify or create after approval

| File | Planned change |
| --- | --- |
| `index.html` | Add the notice markup and persistent reopen button. Retain existing scripts and directory navigation. |
| `js/views.js` | Add notice lifecycle/persistence handling and integrate it into overlay exclusivity, focus handling, global keyboard shortcuts, and initialization. |
| `css/directory.css` | Add scoped rectangular notice styles, responsive scrolling, action layout, safe-area handling, and light/dark variants. |
| `tests/directory.test.cjs` | Extend the DOM harness and add behavioral coverage for notice persistence and interaction with existing overlays. |
| `README.md` | Document the notice behavior, storage key/version, and manual verification requirements. |
| `.impeccable/surfaces/index-html.md` | Record the approved notice extension and its interaction rules during implementation. |

No new application source file, package, backend, endpoint, or route is necessary. `js/providers.js`, `js/adapters.js`, `js/theme.js`, `js/router.js`, `setup.html`, and legacy CSS require no feature changes. The present planning document is the only file created during planning.

## 4. Interaction and persistence flow

Recommended storage key: `aip2026.community-notice`. Store a small record containing a notice version such as `2026-11-v1` and a disposition of `acknowledged` or `dismissed`. This is a display preference, not legal consent or an analytics event; no identity, provider data, API keys, or timestamp is required.

1. Initialize the directory and bind interaction handlers normally. Read notice storage inside try/catch. Open the notice once during homepage initialization when there is no valid record for the current notice version.
2. Here, first visit means the first directory visit without this version's saved preference. Existing visitors will also see a newly introduced notice. Direct visits to `setup.html` do not trigger it; entering the directory does.
3. If another top-level overlay has already opened, do not interrupt it. Show the persistent reopen control and defer any automatic attempt to a future page load. Do not introduce an arbitrary popup timer or reopen on search, sorting, theme changes, resizing, or hash navigation.
4. On open, save a valid return-focus target, lock body scrolling, make background content inert, and focus the notice heading with a programmatic tabindex. This supports reading from the start rather than placing initial focus on a bottom action.
5. `Acknowledge & Continue` saves `acknowledged`, closes the notice, and restores the reopening trigger's focus or the main directory fallback on automatic display.
6. `Browse Directory` saves `dismissed`, closes the notice, and focuses/scrolls to the existing `#main-content` target. Preserve any current search, filters, collection, sorting, and URL hash. Use immediate scrolling, with no navigation reload or new history entry.
7. The close button, Escape, and a deliberate backdrop click save `dismissed` and close. They do not falsely record explicit acknowledgment. A matching record of either disposition suppresses future automatic popups, preventing repeated interruptions after opting to browse.
8. Manual reopening bypasses the automatic-display preference. Closing a manually reopened notice never downgrades an already acknowledged record. Each new open starts the notice reading area at the top.
9. Keep the notice, provider details, and filter drawer mutually exclusive. Preserve the existing supported nesting of the MuseAI guide within provider details. Centralize background/scroll release so closing one overlay cannot unlock content behind another.
10. Extend the current Tab/Shift+Tab trap, Escape priority, and Ctrl/Cmd+K guard to include the notice. Prevent a global search shortcut from moving focus into the inert directory. Preserve focus restoration to visible, connected elements; use main content as fallback.
11. Parse unexpected/malformed storage safely. Attempt localStorage, fall back to guarded sessionStorage when necessary, and finally retain a page-lifetime memory preference. A storage exception must never block dismissal or directory browsing. If every storage mechanism is unavailable, suppression cannot persist across reloads; document that limit.

Matching versions suppress automatic display indefinitely until site storage is cleared. Only a materially changed notice should receive a new version and trigger another automatic appearance. Preview URLs, production domains, browser profiles, and devices have separate storage; clearing it or using a fresh private session can show the notice again.

## 5. Responsive and accessibility strategy

- Use a regular dialog, not an urgent `alertdialog`, with `aria-modal="true"` and `aria-labelledby` pointing to the visible title. Keep the body as semantic paragraphs. Avoid announcing all five paragraphs as one long `aria-describedby` string.
- Keep a visible keyboard focus indicator, a meaningful `Close community awareness notice` label, native buttons, and at least 44px control targets.
- Trap keyboard focus within the active dialog and keep every inert background element, including the skip link outside the shell, out of the focus path. Explicitly include that skip-link edge case in verification.
- Use a viewport-bounded three-part panel: header, independently scrollable reading area, and action footer. On short screens or zoom, allow the entire panel to scroll as a fallback so all paragraphs and controls remain reachable. Keep focused controls visible.
- Bound height using `100dvh` with a `100vh` fallback, account for safe-area insets, and avoid horizontal overflow at 320px, landscape orientation, and 200%/400% zoom.
- Preserve readable contrast in both themes: at least 4.5:1 for normal text and 3:1 for qualifying large text and essential control boundaries/focus indicators. Check rendered colors rather than assuming inherited tokens guarantee compliance.
- Add no entrance animation; use the existing reduced-motion behavior for any shared transitions. Confirm Windows forced-colors/high-contrast presentation.
- Keep the static notice hidden until its lifecycle initializes successfully. If initialization fails, do not leave background content inert or body scrolling locked. Without JavaScript, preserve the existing noscript setup-guide access; do not promise a functioning directory that currently requires JavaScript.

## 6. Potential technical and product risks

| Risk | Mitigation |
| --- | --- |
| Competing overlays release inertness or scroll locks prematurely | Integrate into the existing controller, enforce top-level exclusivity, and test the provider/guide/drawer transitions. |
| Existing focus trap assumes first/last button focus; initial heading focus introduces another state | Extend the trap for the heading/outside-focus cases and verify in a real browser. |
| Storage is blocked, corrupt, cleared, or differs across domains | Guard reads/writes/parsing, use session/page fallback, and explain origin-local persistence. |
| A minor wording edit accidentally reprompts all visitors | Use an explicit notice version and bump it only for material updates. |
| Existing provider CSS overrides square geometry or notice text styles at mobile breakpoints | Use dedicated classes and inspect all shipping viewport/theme combinations. |
| Small-screen body/footer scrolling clips content or traps users | Use bounded flexible rows, a scrollable reading region, and whole-panel overflow fallback. |
| A first-visit interstitial delays discovery | Provide immediate dismissal, persistent suppression for every intentional exit, and direct Browse Directory action. |
| Claims of independence are read as provider verification or absence of referral incentives | Keep the scope and referral-evaluation statements; add no legitimacy/verification claims and preserve existing referral data. |
| Vercel's Git integration or production settings differ from assumptions | Inspect the actual project deployment settings after implementation approval and before deployment. |
| Node DOM-double tests pass despite browser focus/layout defects | Extend behavioral tests, then perform bounded real-browser desktop/mobile and accessibility checks. |

## 7. Step-by-step implementation roadmap

1. Resolve the request's plan-only versus implement/push/deploy scope and approve the copy and dismissal semantics above.
2. Record a baseline of the Git revision, provider/referral files, and passing existing tests. Read Impeccable's craft floor immediately before the first UI edit.
3. Add static dialog markup and the visible reopen control to the homepage without replacing existing components or changing provider records.
4. Add the notice lifecycle and versioned storage to the existing view controller; integrate exclusivity, keyboard handling, inertness, scroll locking, and reliable focus restoration.
5. Add scoped notice CSS using the established theme tokens and the brief's square geometry, then responsive scrolling and safe-area rules.
6. Extend meaningful lifecycle/regression tests and update the feature documentation. Make the test harness model persisted reloads, storage exceptions, and the correct active dialog focusables.
7. Run the existing test command and review the final diff, including exact preservation of provider/referral records. Run Impeccable's detector once against the changed UI files after the UI is complete.
8. Inspect desktop/mobile layouts together in light/dark themes, plus keyboard and short-viewport behavior; fix observed defects in a batch and confirm the affected cases.
9. Prepare a focused feature commit. Stage explicit changed files; do not stage existing untracked `node_modules/` or `.shots/mobile-plan/` content.
10. Confirm the Vercel project's deployment mechanism. If preview deployment is available, validate it before production promotion. If pushing `main` immediately publishes production, account for that before the push.
11. Once implementation and release are authorized, push the focused commit, deploy through the confirmed integration or authenticated project workflow, and verify the resulting production notice and returning-visitor behavior.

## 8. Testing and deployment checklist

### Automated behavior and regression

- [ ] Fresh storage shows the notice once while the directory still initializes normally.
- [ ] Matching acknowledged and dismissed records prevent automatic display on a simulated reload.
- [ ] Older versions show the current notice; corrupt records recover safely.
- [ ] Local/session storage read/write failures never prevent dismissal or browsing.
- [ ] Each button records its intended disposition; Escape, close, and backdrop record dismissal without acknowledgment.
- [ ] Manual reopen works after every disposition and preserves an existing acknowledgment.
- [ ] Browse Directory targets main content without clearing search/filter/collection/sort state.
- [ ] Provider details, nested guide, and mobile filters retain their existing behavior; top-level overlays cannot overlap.
- [ ] Global search shortcuts respect the open notice, and background inertness/scroll locks always release correctly.
- [ ] All existing exact-provider-link, model/filter, theme, and CSS parsing checks pass.

### Rendered and accessibility review

- [ ] Desktop, 730px, 490px, 375px, and 320px widths; mobile landscape and short heights.
- [ ] Both themes, font fallback, reduced motion, and forced colors.
- [ ] Long body remains readable; full labels fit; no horizontal scrolling or hidden actions at zoom.
- [ ] Keyboard open/close, title focus, Tab/Shift+Tab wrapping, Escape, focus restoration, and visible focus.
- [ ] Background and outside-shell skip link cannot receive focus while the notice is open.
- [ ] Screen reader announces the dialog title and allows ordinary paragraph navigation.
- [ ] Disabled JavaScript or initialization/storage failure does not create a blocking overlay.

### Release verification

- [ ] Diff contains no provider/referral changes, personal profile information, new allegations, or invented verification claims.
- [ ] `npm test` passes; no unnecessary Tailwind rebuild or runtime package is introduced.
- [ ] Actual Vercel production branch/build/output settings are confirmed; no nonexistent `npm run build` is assumed.
- [ ] Commit includes only the feature files and intended documentation; current untracked artifacts remain excluded.
- [ ] Preview and production assets return HTTP 200 and correspond to the expected commit/deployment.
- [ ] Production fresh-profile display, acknowledgment, reload suppression, manual reopen, and directory links work.
- [ ] No new network calls, analytics, secrets, images, or font requests are added by the notice.
- [ ] Rollback is available by reverting the focused notice commit and redeploying; retain unrelated provider updates.

Implementation was authorized in the subsequent request on November 6, 2026. That request overrides the visual proposals above with the supplied gradient-card reference, Community Notice title, local multicolor bracket mark, 680px square outer panel, and stacked actions. The interaction, persistence, accessibility and provider-data safeguards remain the implementation contract. This document records the original plan; README.md records the implemented behavior and outstanding rendered-verification limits.
