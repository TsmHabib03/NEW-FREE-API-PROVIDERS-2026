# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers comfortable with CLIs who want to run Claude Code or Codex CLI through free or free-credit API gateway providers. They arrive looking for a provider that works today, then need the exact shell configuration to make it run.

## Product Purpose

A single-page curated directory of free/compatible AI API providers with step-by-step setup guides for Claude Code, Codex CLI, and CC Switch. Success: the visitor picks a provider, signs up, configures the client, and sends a working request within minutes.

## Positioning

One page combining the provider directory (with live status: HOT / NEW / Unavailable) and the concrete client-configuration commands — free-API lists stop at links, and vendor guides stop at one vendor.

## Operating Context

Static site opened directly in a browser or served over plain HTTP; no build step, no backend, no analytics. Visitors copy PowerShell commands into their own terminals; providers are external services whose offers, credits, and availability change without notice.

## Capabilities and Constraints

- Static HTML/CSS/JS only: `index.html`, `css/style.css`, `js/app.js`.
- All provider sign-up links carry referral/invite codes and must be preserved verbatim.
- ~40 providers with logos in `assets/`; several use the fallback `gorouterlogo.png`.
- Badge vocabulary: HOT, NEW, "New API" chip, Unavailable (disabled: TaBi Token, GoRouter).
- Existing behavior to preserve: per-provider tabs, copy buttons, Ctrl/Cmd+K search, reading progress, mobile panel, site loader.
- All credential examples are placeholders; the site never collects or stores keys.
- Availability notices for offline providers must stay visible.

## Brand Commitments

- Site name "AI Coding API Credits 2026"; brand label "Credits 2026"; favicon `gorouterlogo.png`.
- User-pinned direction (2026-10-11): full theme redesign into a dark developer-terminal world with subtle static-glow badges — no constant shimmer/flame animation.

## Evidence on Hand

- Real provider sign-up URLs and logos (`assets/*.png|svg|webp`); provider status labels are user-maintained truth.
- No testimonials, pricing tables, or benchmark data exist, and none may be invented.

## Product Principles

1. Scan speed first: a working provider is findable in seconds.
2. Status honesty: offline providers stay visible but disabled, never deleted.
3. Copy-paste-able truth: every command block is real, credentials stay placeholders.
4. One visual language from directory to terminal: the page looks like the environment it configures.
