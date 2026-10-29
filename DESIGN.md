---
name: API Hub directory
description: A lavender discovery workspace with warm card focus and violet provider details.
colors:
  canvas: "#a49aeb"
  surface: "#ffffff"
  surface-soft: "#f8f9fc"
  ink: "#222331"
  muted: "#626274"
  line: "#eeeef4"
  primary: "#4469dc"
  primary-hover: "#3154c4"
  violet: "#7950dc"
  violet-soft: "#f0eafb"
  violet-ink: "#7352a6"
  mint-soft: "#e6f5ee"
  mint-ink: "#307255"
  blue-soft: "#eaf1fd"
  blue-ink: "#3e6a9f"
  red-soft: "#fff0ee"
  red-ink: "#b3443e"
  modal-action: "#8350e3"
  dark-canvas: "#302951"
  dark-surface: "#191923"
  dark-ink: "#f0eff7"
  dark-muted: "#b0adbf"
  dark-primary: "#8ba4ff"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  card-body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.5
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  tag: "5px"
  control: "8px"
  input: "10px"
  card: "16px"
  shell: "24px"
  modal: "26px"
  action: "30px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  shell-inline: "42px"
  modal-inline: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
    height: "44px"
  search:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    height: "46px"
  provider-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 22px 20px"
  modal-action:
    backgroundColor: "{colors.modal-action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.action}"
    padding: "13px 24px"
    height: "54px"
---

## Overview

**Creative North Star: "Useful discovery, warm focus."**

The directory is a quiet white workspace held by a lavender canvas. Provider content owns the hierarchy. Warm radial light marks the card a visitor is exploring; a violet fade and floating logo give the selected provider a focused details view.

This documents the implemented directory in index.html. The existing setup documentation has its own styling. Values are derived from code; browser rendering and reference fidelity remain unverified because the browser access host is unavailable.

**Key Characteristics:**

- Lavender framing with white content surfaces.
- Compact metadata and readable provider descriptions.
- Warm card hover and focus with a violet details modal.
- Honest unknown, offline and missing-link states.

## Colors

Blue #4469dc carries directory actions, active collections and input focus. Violet and mint distinguish metadata. Ink #222331 and muted #626274 sit on white and pale neutral fields. Offline notices use red #b3443e on #fff0ee.

Dark theme changes the canvas to #302951, surfaces to #191923, ink to #f0eff7 and muted copy to #b0adbf. Actions become #8ba4ff with dark text. The modal retains a purple field while its lower content fades into the dark surface.

**The Truth Rule.** Color may distinguish a recorded state; it must not imply measured reliability or an undocumented capability.

## Typography

DM Sans is the display and body face, with system-ui as the loading fallback. JetBrains Mono is reserved for model IDs and invitation codes. The page loads fonts from Google Fonts.

The directory heading is 34px/1.25 at weight 600, card titles 18px/1.35 at weight 700, descriptions 13px/1.7, body text 14px/1.6, and metadata generally 11–12px. Modal headings are 32px/1.25; modal body copy is 14px/1.75. Small screens reduce the page heading and retain card titles at 18px. Descriptions clamp to two lines; full copy is available in details.

**The Code Rule.** Monospace identifies literal model IDs or copyable codes.

## Layout

The application shell is at most 1320px wide. Desktop body padding is 48px 36px. A 200px sidebar sits beside the main grid with a 38px gap and 42px shell padding. The card grid has three fluid columns with 17px gaps.

At 1190px and below the grid becomes two columns and the sidebar narrows to 165px. At 730px the sidebar becomes a fixed filter drawer, search moves below navigation, and result announcements remain visually hidden but accessible. At 490px the grid becomes one column. At 360px shell padding contracts further.

The modal is at most 600px wide, with a viewport-bounded scroll container. Its 170px hero ends behind an 88px logo that overlaps by 44px. Content starts with 68px top padding. Small and short viewports reduce hero/logo dimensions while preserving scroll access.

## Elevation & Depth

The shell casts 0 20px 70px rgba(67,53,133,.13). Cards use 0 5px 20px rgba(46,43,82,.085), becoming 0 12px 32px rgba(46,43,82,.13) during hover or focus. A translucent warm radial layer fades in within the card; it carries no information independently of focus.

The modal uses 0 24px 90px rgba(27,15,56,.25), with 0 12px 28px rgba(82,39,150,.17) beneath the floating logo. Its dimmed backdrop uses a 5px blur to preserve focused context.

## Shapes

Cards use 16px corners, the desktop shell 24px, and the modal 26px. Compact tags use 5px; ordinary actions use 8px; search uses 10px. Modal actions are 54px high rounded pills. Provider logos sit in colored rounded squares. The reference-driven modal includes a subtle geometric grid at the edges of its purple field.

## Components

Provider cards stack logo/date, name, description, tags, feature bullets, availability, three metrics, and actions. A Featured badge uses the shared card structure. Hover and focus-within activate the warm gradient. Details opens the modal; Docs and Get API remain independent links.

Primary directory buttons are blue with white text in light theme and dark text in dark theme. Secondary buttons use an outlined neutral surface. Icon controls are 44px square. Global focus uses a 3px accent outline with a 4px offset.

Checkbox filters group category, auth, status and client compatibility. Options use OR within a group and AND across groups. Collections scroll horizontally when space is limited. Active collections use blue text and a 2px underline.

The shared modal injects the selected provider record. Documentation and Get API are stacked pills; Get API includes a white circular arrow. Technical models, metrics and connection details sit in a disclosure. Escape, backdrop and close controls restore focus; the background is inert. The nested MuseAI guide preserves the parent's selected provider.

**The Unknown Rule.** Unpublished metrics render "Not listed"; other missing technical details render "Not documented". Offline providers stay visible and cannot launch sign-up.

Motion is bounded: a 280ms modal arrival, 300ms warm overlay fade, and 220ms filter drawer transition. Reduced-motion preferences remove these transitions and entrance animation.

## Do's and Don'ts

### Do

- Do preserve exact provider endpoints and referral parameters.
- Do pair color with explicit availability text.
- Do keep full provider descriptions available in the modal.
- Do preserve keyboard focus, mobile announcements and reduced motion.
- Do use the same white card structure for featured and ordinary providers.

### Don't

- Don't invent request rates, latency, uptime, models or auth methods.
- Don't replace provider-specific links with placeholder endpoints.
- Don't hide offline records or remove their stored URLs.
- Don't treat old screenshots or code tests as current rendered verification.
