# Surface brief — index.html

## Scope and visitor mode

Single docs/directory page ("Read" with a "Persuade" provider-launch block). Audience: CLI developers hunting for a free, working API gateway for Claude Code / Codex CLI, then configuring it. Primary action: open a provider sign-up link, then copy the client config.

## Direction contract

THESIS: The page is itself the environment it configures — a command deck, not a brochure. It refuses the light-blue corporate docs look and the marketing-landing hero.
OWN-WORLD: Deep space-black/indigo layered surfaces, one cyan accent for live/interactive, violet secondary for structure marks; terminal green reserved for success states. Glass panels with fine 1px hairlines, soft deep shadows, JetBrains Mono for code/data/badges, DM Sans for prose. Status badges are static gradient chips with subtle glow — no looping animation.
STORY: Visitor lands in a dark control room; the terminal hero shows the request flow; the provider deck reads as live gauges (status dot, badge, one-line offer); guide sections read as numbered console panels with copyable command blocks.
FIRST VIEWPORT: Left 55%: oversized tight-tracked headline "AI Coding API / Credits 2026" with cyan-gradient key word, two-line lede, dual CTAs (primary cyan-filled "Start Claude Code guide", quiet outline "Start Codex guide"). Right 45%: glowing terminal window (traffic dots, request-flow.txt content, blinking caret) on an indigo glow field. Sticky top bar + left rail already visible.
FORM: Dark developer terminal (user-pinned). Chosen from user answer; no roll needed — direction pinned by explicit user choice.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## States and ranges

- Providers: ~40 rows/cards, 3 disabled (offline) states, HOT/NEW/New API/Unavailable chips.
- Tabs: 30+ provider config tabs incl. 2 disabled with warning notices.
- Code blocks: copy → "Copied!" for 2s fallback text; loader skeleton on load; search overlay empty state.

## Interaction and layout

Keep existing JS behaviors. Hero grid → provider CTA deck (3-col) → doc sections (gateway, providers grid, Claude Code tabs, Codex, CC Switch, credits/offer rows, security, troubleshooting, skills) → provider footer shortcuts → footer. Same breakpoints: 1440 max, 1050, 820, 580, 380.

## Unresolved decisions

None material — build in place on existing files, no framework.
