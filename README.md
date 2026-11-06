# Free API Providers 2026

A static API directory for developers using Claude Code, Codex CLI, and compatible clients. Search providers or documented models, combine checkbox filters, and inspect a provider before following its sign-up link.

## Run locally

Serve the project folder with any static HTTP server:

```powershell
python -m http.server 8080
```

Visit http://localhost:8080. No backend or API key is required to browse. The site does not collect or store API keys.

## Structure

- index.html: directory workspace, filters, shared details modal, MuseAI claim guide, and community notice.
- css/directory.css: responsive directory and modal styles, light/dark themes, warm hover/focus glow.
- js/providers.js: provider records and exact referral/sign-up URLs shared with setup.html.
- js/adapters.js: documented metadata, collections, filters, optional features and metrics.
- js/views.js: search/filter state, cards, dynamic modal, endpoint actions, focus management, and guide copying.
- js/icons.js: bundled SVG icon set.
- js/theme.js: persisted directory theme.
- assets/gorouterlogo.png: existing site favicon and brand mark, reused by the community notice.
- setup.html and its existing CSS/scripts: client setup documentation.

## Provider metadata

Existing provider records remain the source of truth. Optional fields can add new categories, documented auth methods, feature data, and published metrics:

```js
{
  category: ['Weather', 'Finance'],
  authType: ['api-key'], // api-key, oauth, none, unknown
  docsUrl: 'https://provider.example/docs',
  dataFormat: 'JSON',
  rateLimit: '120 requests/min',
  metrics: {
    requestsPerMinute: 120,
    latencyMs: 85,
    uptimePercent: 99.9
  }
}
```

This example describes the schema; it is not a live provider or measured telemetry. Metrics accept finite nonnegative numbers, with uptime limited to 100. Missing or invalid values show **Not listed**. Other unpublished features show **Not documented**. The existing AI directory defaults category to AI; OAuth and No Auth require explicit metadata.

Checkbox options use OR within each group and AND across groups. Search, collections, and sort combine with the chosen filters.

Provider Docs use docsUrl, then guide. When neither is supplied, the link opens setup.html; the modal explains this fallback. Get API uses the provider's exact url, preserving referral parameters. Offline (status off) providers stay visible with sign-up disabled; restricted and login-issue providers retain links and show their caveats.

## Community awareness notice

The homepage displays the current notice once when no matching preference exists. The persistent **Community notice** button near the directory introduction reopens it. The latest approved reference replaces the three-card design with a rounded, 410px vertical card: an orange/coral, lavender and beige rectangular mosaic header, the existing circular site favicon, a solid reading surface with three levels of DM Sans typography, and one full-width **Acknowledge & Continue** button. A slow, continuous opacity crossfade changes the header palette without moving the pixel edges. Reduced motion disables it; light/dark and forced-color styles remain scoped to the notice. The whole card scrolls on small or short viewports, with safe-area padding.

The `aip2026.community-notice` storage record is `{ "version": "2026-11-v1", "disposition": "acknowledged" }` or `"dismissed"`. **Acknowledge & Continue** records acknowledgment. X, Escape, and a backdrop click record dismissal. Both suppress automatic reopening for this version; manually reopening and closing never downgrades acknowledgment. The version stays unchanged for this redesign so previously acknowledged visitors are not interrupted again; they can use the reopen button to read the revised notice. Bump it for a future material notice requiring a new first-visit announcement.

Storage access and parsing are guarded. Local storage provides persistence, session storage provides a fallback, and page memory still suppresses repeated automatic attempts when both are blocked. If all storage is blocked, suppression cannot survive reloads. Storage is separate for each origin, browser profile, and device. The record contains no identity, API key, timestamp, or analytics data.

The notice focuses its heading, traps Tab/Shift+Tab within its close and acknowledgment buttons, makes the directory and skip link inert, and restores focus on exit. Dismissal preserves the directory filters, search, sorting, collection and URL. The notice, provider details, and filter drawer are mutually exclusive; the existing MuseAI guide still nests within provider details. Static markup remains hidden without JavaScript. The exact three approved paragraphs retain the directory's independent-service disclaimer, referral-evaluation advice and transparency commitment; provider/referral records are unchanged.

## Checks

```powershell
npm install
npm test
```

Tests execute the real provider, adapter, and view scripts against a small DOM double. They cover record coverage, exact card/modal links, filters/search, collections/sorts, modal state, nested guide, optional metadata, unsafe URL rejection, and theme state. Notice coverage adds fresh display, persisted reloads, invalid/versioned records, storage exceptions, focus restoration/trapping, manual reopening, shortcut guards, state-preserving exits, overlay exclusivity, and missing-markup recovery. CSS parsing uses the existing PostCSS dependency.

These tests do not validate browser layout, native focus behavior, accessibility trees, or screenshot fidelity. Desktop/mobile visual review remains necessary when browser access is available. The browser access host was unavailable and native Chrome access was rejected during this rebuild. Directory CSS is hand-authored and requires no build; the existing build:css command remains for the legacy Tailwind stylesheet.

Manual notice checks: vertical card and scrolling at 730px, 540px, 375px and 320px; short landscape screens and 200%/400% zoom; both themes; reduced motion and forced colors; heading announcement and paragraph reading; visible keyboard focus and scroll reachability; every dismissal and returning-visitor reload; provider/guide/filter behavior after dismissal. Browser review was unavailable during implementation, so these remain release verification limits.
