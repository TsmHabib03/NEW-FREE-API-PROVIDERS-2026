# Provider directory — UX review wireframes

**Implemented preview:** These historical wireframes are superseded by [screenshots and actual-build review](PROVIDER-PREVIEW-REVIEW.md). New now uses Checked public evidence and Not tested for inference; Spotlight retains strict verification and currently stays hidden.

November 16, 2026. **Planning artifacts only; no application UI was changed or deployed.** These wireframes show the revised sequence, real planned provider names, and honest empty promotion states. They express layout intent, not screenshot-verified rendering. See the [revised plan](PROVIDER-UPDATE-PLAN.md) and [order diff](PROVIDER-ORDER-DIFF.md).

## Desktop layout

Preserve the current lavender canvas, white content shell/cards, blue actions, DM Sans, and mint/violet metadata. Make provider selection the main task. Reduce unknown metrics on the card surface; retain full evidence and technical details in the existing dialog.

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ API Hub                                       Discover  Setup guides  Theme  │
│ Search providers or models…                                      [Ctrl K]   │
│ [No card] [Install needed] [Free credits] [More filters]  [Clear]  73 records  │
├───────────────────────────────────────────────────────────────────────────────┤
│ PINNED · 4                                                                    │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│ │ PixRouter      │ │ AgentRouter    │ │ Token Forge    │ │ ArtBloom       │   │
│ │Image Generation│ │Astra · Sol ·5.6│ │ Starter credit │ │ Back           │   │
│ │ Image routes   │ │ Daily Astra    │ │ Grant details  │ │ $10 signup     │   │
│ │ listed         │ │ supply limit  │ │ in Details     │ │ No card        │   │
│ │Details / Start │ │Details / Start │ │Details / Start │ │Details / Start │   │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                                               │
│ NEW THIS WEEK — appears here only when eligible verified entries exist        │
│ Recently added · shown for 14 days                         [Previous] [Next]  │
│ [NEW · eligible entry] → [NEW · eligible entry] → … maximum 5                 │
│ (Current draft has no usage-verified candidates: entire strip hidden.)        │
├───────────────────────────────────────────────────────────────────────────────┤
│ [Recurring] [Signup credits] [Community] [Installed] [Roleplay] [Paid] […]     │
│ ↑ Sticky category anchors; same section order as the final order table        │
├───────────────────────────────────────────────────────────────────────────────┤
│ RECURRING FREE OFFERS · 4                                                      │
│ [FreeModel.in]          [xKiro]                 [CodeCraft]                    │
│ [Clean APIs]                                                                  │
│                                                                               │
│ SPOTLIGHT · Week of [date]                                                     │
│ [One verified entry beyond its category's top 6 · evidenced reason · action]  │
│ (Current draft has no qualifying pool: slot hidden.)                          │
│                                                                               │
│ SIGNUP CREDITS · 1                                                             │
│ [LLMsRelay]                                                                   │
│                                                                               │
│ CONDITIONAL / COMMUNITY FREE · 10                                              │
│ [Ireze]                [MarsAI]                [Qronos]                       │
│ [HCNsec]               [LM0]                   [KVOTUM]                       │
│                           [Show all (10)]                                     │
│ Expands in place: Vyce AI → OrvAPI → Selora → VSLLM; then [Show less]           │
│                                                                               │
│ INSTALLED CODING TOOLS · 5                                                     │
│ [Utim · Install]       [Qoder · Install]        [ZCode · Install]              │
│ [FREE-PI · Install]    [OmniRush · Unverified · Install]                       │
│                                                                               │
│ ROLEPLAY GATEWAYS · 2                                                          │
│ [TokenReply]           [UnoRouter · Signup needs review]                      │
│                                                                               │
│ PAID / FREE ALLOWANCE UNCONFIRMED · 8                                          │
│ [APIMaster]            [FloodGate]              [Zurelay]                      │
│ [Byesu · Referral]     [KiosAPI]                [Tokeness]                     │
│                            [Show all (8)]                                     │
│                                                                               │
│ PAID SUBSCRIPTION BUNDLES · 1              [Top Tools AI]                     │
│                                                                               │
│ MORE API GATEWAYS: TERMS NEED EVIDENCE · 10                                    │
│ [Qianxing]             [Yzmao]                 [Bluesminds]                   │
│ [Codex-Relay]          [FlushAPI]              [AetherAI · Referral]           │
│                           [Show all (10)]                                     │
│                                                                               │
│ SHARED QUOTA MARKETPLACE · 1             [TokenBom]                          │
│ CLOUD AI APPS / RESOURCES · 3             [Foundable] [MuseAI] [local.ai]     │
│                                                                               │
│ ▸ Needs review (6)                                             collapsed     │
│ ▸ Disabled (18)                                                collapsed     │
└───────────────────────────────────────────────────────────────────────────────┘
```

The page count is the unique inventory, not an active/verified count. Pinned and category cards retain documented caveats. The illustrative NEW and Spotlight cells are placeholders for future eligibility, not real verified endorsements. Empty promotion blocks leave no vacant gap. Category counts exclude the four pins; no redundant pin cards appear below.

## Mobile layout

Search and all three quick filters are visible before the pinned cards. At narrow widths pins stack in exact order. Only New is horizontally scrollable; do not make the pins an automatic carousel. Category previews show six records in one column, reducing the initial length of larger sections.

```text
┌───────────────────────────────────┐
│ API Hub       Guides       Theme │
│ Search providers or models…     ×│
│ [No card] [Install needed]       │
│ [Free credits] [More filters]    │
│ 73 records               [Clear]│
├───────────────────────────────────┤
│ PINNED · 4                       │
│ ┌─────────────────────────────┐ │
│ │ PixRouter                   │ │
│ │ Image Generation            │ │
│ │ Image routes listed         │ │
│ │ [Details]    [Get started]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ AgentRouter                 │ │
│ │ Astra · Sol · 5.6           │ │
│ │ Astra: daily limited supply │ │
│ │ [Details]    [Get started]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Token Forge                 │ │
│ │ Starter credit              │ │
│ │ See Details for grant terms │ │
│ │ [Details]    [Get started]  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ArtBloom              Back  │ │
│ │ $10 signup · No card        │ │
│ │ [Details]    [Get started]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ New this week           ‹  ›    │
│ Recently added · 14-day window  │
│ [NEW eligible] [NEW eligible…]→ │
│ ↑ Hidden until verified pool   │
├───────────────────────────────────┤
│ [Recurring] [Credits] [Tools] → │
│ Sticky category anchors         │
├───────────────────────────────────┤
│ Recurring free offers (4)       │
│ [FreeModel.in]                  │
│ [xKiro]                         │
│ [CodeCraft]                     │
│ [Clean APIs]                    │
│                                 │
│ Spotlight · Week of [date]      │
│ [Verified lower-ranked entry]   │
│ ↑ Hidden until eligible pool   │
│                                 │
│ Signup credits (1)              │
│ [LLMsRelay]                     │
│                                 │
│ Community free (10)             │
│ [Ireze]                         │
│ [MarsAI]                        │
│ [Qronos]                        │
│ [HCNsec]                        │
│ [LM0]                           │
│ [KVOTUM]                        │
│ [       Show all (10)        ] │
│                                 │
│ Installed coding tools (5)      │
│ Utim → Qoder → ZCode → FREE-PI  │
│ → OmniRush [Unverified]         │
│ Each is its own Install card    │
│                                 │
│ Other categories follow…       │
│ Byesu/AetherAI show Referral    │
│                                 │
│ ▸ Needs review (6)              │
│ ▸ Disabled (18)                 │
└───────────────────────────────────┘
```

When scrolled, a compact search/quick-filter area and category bar stack with measured offsets. Keep safe-area padding and section scroll margins; at large text or short viewport heights drop sticky behavior if it hides content. Controls have visible focus and at least 44px targets. Selected quick filters use text/state plus color; More filters opens the existing accessible drawer.

## Interaction review

| State / action | Planned result |
|---|---|
| Default | Four pins, eligible New if any, category anchors, category previews; archives collapsed. |
| Show all (10) in Community | Only Community expands to its ten matches; control becomes Show less. Other categories stay unchanged. |
| Needs review / Disabled disclosure | Opens first six records; larger archive offers Show all (N). Helyx is retained at Disabled #6 with disabled signup. |
| Search “Helyx” | Matching archive opens temporarily; one unique result, disabled action, owner-disable reason. Clearing search restores the archive's base collapsed state. |
| Search “Token Forge” | Its matching pin remains at its fixed relative position; no duplicate category result. |
| No card + Install needed | AND across chips; only explicitly documented matches remain. Counts and Show all use matching records. |
| Active search or quick filter | Suppress New/Spotlight, search hidden category tails, group results by category, keep fixed matching pin order. |
| Newest / A–Z | Sort non-pinned entries inside each category only; pin/category order fixed. |
| 14-day addition boundary | NEW eligibility ends at age 14 days; return/edit/verification never resets addition date. |
| Monday Manila boundary | Deterministic Spotlight rotates among eligible verified entries beyond category top six; no order change. |
| Empty verified pool | Hide New/Spotlight without blank placeholder cards in the eventual product. |
| Details for software match | “Same software: [family]” note; no quality score, duplicate-owner claim, or rank penalty. |
| Analytics unavailable | Links/navigation/expansion keep working; no request delays and no referral rewriting. |

Token Forge's Starter credit badge is required owner wording; audit did not establish its amount or grant conditions. Details must retain that evidence distinction. “Unverified” for OmniRush means usage was not confirmed, while public docs and package evidence still support placing it among installed tools.

Before any later deployment, present the actual implementation's refreshed order diff and rendered mobile/desktop/dark previews. These wireframes do not authorize deployment.
