# AgentCall announcement preview

This separate static page extends the supplied AgentCall landing page with a
two-step announcement. `index.html` contains the complete scoped modal CSS,
markup, inline supplied AgentCall SVG, and vanilla JavaScript.

The Community Announcement opens on every page load. Its primary button
transitions to Integration Featured, whose action opens the existing AgentCall
signup/login page. The X, Escape key, and backdrop dismiss the announcement.
Keyboard focus stays in the dialog while open; dismissal restores page focus,
scroll position, and the original page styles. Reduced-motion preferences skip
the transitions.

The export keeps the original landing content and local image assets. Saved
browser-extension markup and third-party analytics snapshots were removed.
The Google Fonts stylesheet is local; its font files still load from Google's
font host, with the original fallback fonts available if those requests fail.

The announcement is a local extension of the supplied AgentCall design.
It inherits the original paper/white surfaces, ink, lime, muted text, border,
and radius tokens, plus Inter for headings and controls and Instrument Serif
for descriptive copy. Its CSS is scoped to `.ac-announcement`; the 504px dialog,
colored upper preview, rounded white shell, and 274px dark pill action are
specific to the supplied modal references. The pale blue preview color and
soft modal shadows are local component treatments. This page does not revise
the API Hub design system recorded in the repository's `DESIGN.md`, `PRODUCT.md`,
or `.impeccable/design.json`.

The dialog scrolls internally when space is limited. Its height cap and overlay
padding share the same top/bottom safe-area variables, with a `100vh` fallback
and `100dvh` enhancement. Narrow and short viewport rules reduce the preview
and copy spacing; these source safeguards still require rendered verification.

Run `npm run test:agentcall` from the repository root to check the actual inline
modal script with jsdom. `npm test` also runs the existing API directory checks.
These tests cover the trigger, both steps, keyboard traversal, dismissal,
transition cancellation, reduced motion, focus/scroll cleanup, and asset paths.

Browser rendering has not been verified in this environment: the browser host
was unavailable and native Chrome access was denied. Desktop/mobile reference
fidelity, hover rendering, and short-viewport scrolling still need browser
inspection. Existing API Hub screenshots are unrelated to this page.
The finish review disposition remains **recapture** until those browser
captures and interaction checks are available; source and automated checks
do not certify visual fidelity.

The deployment route is `/agentcall/` on this repository's GitHub Pages site:
https://tsmhabib03.github.io/NEW-FREE-API-PROVIDERS-2026/agentcall/.
