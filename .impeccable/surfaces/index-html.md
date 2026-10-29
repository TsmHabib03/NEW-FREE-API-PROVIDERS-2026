---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief — API directory

## Scope and visitor mode

Operate. Developers discover a suitable free or free-credit API gateway, check documented capabilities and availability, and follow the provider's exact sign-up URL. Setup documentation remains on setup.html.

## Direction contract

THESIS: A useful API discovery workspace with immediately usable filters and provider-specific details.
OWN-WORLD: Lavender canvas, rounded white application shell, DM Sans, blue actions, violet/mint metadata and soft-shadow white cards. The latest reference pins a warm orange/yellow radial glow on hover or keyboard focus, and a purple-to-white modal with a floating provider logo.
STORY: Search a provider or model, combine category/auth/status/client filters, inspect honest status and offer data, then open the provider's sign-up endpoint.
FIRST VIEWPORT: Logo and global search across the top; a directory heading; a 200px checkbox rail beside three columns of cards. Collections and sorting sit above the grid. One ordinary white card receives a Featured badge.
FORM: User references override seed 818a802c. Image #2 is only hover inspiration. The earlier Finder workspace composition stays; the latest request replaces the coral featured format with the shared white card format.
FINISH: Complete the fresh finish review and token-bearing design documentation; describe verification limits explicitly.

## Content and data

- All 63 incumbent provider records remain visible in All providers, including 14 offline records; counts derive from providers.js.
- Card: provider logo, date, name, two-line description, documented offer/auth/client tags, feature bullets, status/model count, Req/Min–Latency–Uptime % metrics, Details, Docs, Get API.
- Metrics read optional numeric requestsPerMinute, latencyMs, uptimePercent; missing/invalid values render "Not listed". Data format and rate limits default to "Not documented". No synthetic telemetry.
- Category defaults to AI for this existing directory. Explicit category and authType metadata support additional categories and OAuth/No Auth without inventing providers.
- Only status off disables sign-up. Restricted/login-issue records retain their links and caveats.
- Exact referral/sign-up URL strings in providers.js remain unchanged. Provider documentation uses docsUrl or guide; missing documentation leads to setup.html with an explanatory modal note.

## Interaction and layout

- OR within a checkbox group; AND across groups. Search tokens combine with filters and collections. Sort supports curated, newest, and name.
- Card surface, title, and Details open the centralized modal. Direct links work independently.
- Modal injects logo/name/blurb/offer/models/client routes/metrics and links from the selected record. Escape, backdrop and X close; focus returns to the original opener. Background is inert.
- MuseAI nested seven-step guide and invitation-code copying remain; nested guide owns focus while open.
- Desktop: shell up to 1320px, three columns. At 1190px and below: two columns. At 730px: sidebar becomes a modal drawer and search moves below navigation. At 490px: one column. Small/short viewports scroll the modal.
- Light/dark themes, keyboard focus, reduced motion, no-result recovery, disabled and missing-data states are supported. Search result announcements remain accessible on mobile.

## Verification limits

Browser access host unavailable; no current screenshots exist. DOM-double tests verify data, generated markup, and event wiring, not CSS rendering, actual browser focus, overflow or visual fidelity. Do not use old .shots/mobile-plan captures as evidence of this redesign.
