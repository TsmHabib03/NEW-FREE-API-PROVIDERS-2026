# Provider directory preview review

Implemented November 16, 2026 using Impeccable within the existing lavender, white, blue, and dark-theme design.

Preview: https://new-free-api-providers-2026-vyrcq8v59-tsmhabib03s-projects.vercel.app/

At the preview review, Vercel reported this exact deployment READY with target preview. Its existing Vercel Authentication protection remained enabled. Production was unchanged during that review. The owner subsequently approved production publication and a Git push with "okay deploy git push". The approved release keeps this application unchanged; publication status is verified separately.

## Actual build and screenshots

- [Complete before/after order diff](PROVIDER-ORDER-DIFF.md) and [CSV](PROVIDER-ORDER-DIFF.csv), generated from the deployed application.
- [Desktop overview](.shots/provider-preview/desktop-viewport.png) and [New strip/category navigation](.shots/provider-preview/desktop-discovery.png).
- [Mobile overview](.shots/provider-preview/mobile-viewport.png), [mobile New strip](.shots/provider-preview/mobile-discovery.png), and [mobile dark theme](.shots/provider-preview/mobile-dark.png).
- Full-page [desktop](.shots/provider-preview/desktop.png) and [mobile](.shots/provider-preview/mobile.png) captures.

## Implemented behavior

73 unique providers, with fixed pins PixRouter → AgentRouter → Token Forge → ArtBloom. PixRouter has Image Generation and no confirmed-free claim. Token Forge has Starter credit (amount not confirmed); ArtBloom has Back. AgentRouter's catalog contains exactly gpt-6-astra, gpt-6.1-sol, and gpt-5.6-sol. AetherAI and Byesu retain their exact referral links and Referral badges; AetherAI reuses the GoRouter logo.

Helyx is retained in Disabled, with signup disabled. ThreeRouter is removed. Installed tools are Utim → Qoder → ZCode → FREE-PI → OmniRush, with OmniRush marked Unverified. Same-software evidence is a details note with no rank effect; visual provider-UI comparison remains pending.

Layout follows Pinned → New this week → sticky category anchors → category sections. Sections show six providers with Show all where needed. Needs review and Disabled are collapsed initially. Search covers the complete inventory, including section tails and archives; search and quick filters expand matches. Empty promotion slots leave no gap.

The current New strip contains AetherAI, Byesu API, Tokeness, TrueSOTA, and XingChiAPI. Eligibility requires a live site, signup, documented terms, and a dated Checked record. Every New card says Not tested for inference. Original addition dates expire at 14 days. Spotlight requires recent successful account and inference evidence within 30 days, rotates on Mondays in Manila time, and is hidden because no provider currently qualifies.

## Validation and limits

- 19 meaningful automated tests pass, including receiver origin validation and anonymous-property allowlisting.
- Real-browser checks pass for fixed ordering, complete search, expansion, quick filters, keyboard navigation, disclosures, modal focus, setup tabs, and no page overflow at 320, 390, 768, and 1440 pixels.
- No browser JavaScript errors or broken directory logos. Axe WCAG A/AA checks report zero violations on the directory and mobile drawer/modal in both themes. These automated checks do not replace a human screen-reader audit.
- 84 served static files match the staged build after removing Vercel's injected preview feedback script from HTML comparison.
- Preview analytics responds 204 to a valid event, 400 to an invalid event, and 403 to a foreign origin.
- All 73 retained outbound destinations match the baseline exactly.

Click analytics uses a same-origin Vercel receiver and logs only allowlisted provider/action/category/placement/order-version or filter/disclosure fields. It adds no cookies, identifiers, raw search, URLs, or referral codes and honors DNT/GPC. Basic events are available in Vercel logs; no aggregate dashboard or persistent analytics database was added. Platform access logs are separate from the application event payload.

Ranking is based on dated public research and offer/service categories. Inference, model authenticity, operator ownership, comparative performance, and continuous uptime were not independently verified. No API account was created or credit redeemed for this audit.

Owner review completed; production publication and Git push authorized.
