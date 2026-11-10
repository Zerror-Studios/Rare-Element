# PRD-027 — Lookbook module (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-11-11 (the storefront follow-up, backend D8/D10); checked against the sample store, not yet reviewed in a browser |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-027-lookbook-module.md`](../../../../zcom-backend/docs/prd/PRD-027-lookbook-module.md) |
| Approved by / on | Anand (owner), 2026-11-11: "Both stores now (Recommended)" (backend D10) |

## UX in this storefront

- **`/lookbook`** (`app/lookbook/page.jsx`, ISR 5 minutes): a cover grid of the store's lookbooks from `getLookbooks`, in the listing header style; none, or a read error → an empty state. No nav link yet (owner decision).
- **`/lookbook/[slug]`** (`app/lookbook/[slug]/{page,lookbook-client}.jsx`, ISR 5 minutes): `getLookbook` through the kit (cached per request); `redirectTo` → 308, none → 404; `generateMetadata` from the SEO fields. Page: hero (`products_hero-section`), the intro, the featured products, then one `components/lookbook/LookSection.jsx` per look (`GreenBoxBtn` CTA, product cards in the listing grid), styles in `styles/components/lookbook/lookbook.css`.
- **Looks** (layouts FULL_BLEED, SPLIT, GRID, TEXT, VIDEO, in `position` order): hotspot dots are buttons labelled with the product name and open a small card with the price and a link; Escape or a click outside closes it. Below 768 px a look uses its mobile image and `mobileHotspots`; without a mobile image it shows no dots and the look's product strip lists every tagged product. Tagged images keep their aspect ratio. A CTA shows only for a relative or https link. Videos are muted, looping, with a Play/Pause button.
- **Analytics:** `lookbook_view` once per page, `lookbook_hotspot_click` per opened dot; product cards send `select_item` with `item_list_id = lookbook:<slug>` (custom dimensions `lookbook_slug`, `look_position`).
- **SEO:** lookbooks are in the sitemap.

## Decisions here

- The rendering rules are one pure util with no imports (tested with `node:test`), kept in sync with the other storefront's twin.
- `next/image` allows the platform media CDN (`media.zerrorstudios.com`, `media-uat.zerrorstudios.com`, backend PRD-039), where every store's media is now served.

## Implementation log

| Date | Entry |
|---|---|
| 2026-11-11 | Built: `src/utils/lookbook.js`, `src/components/lookbook/{LookSection,LookHotspotImage}.jsx`, `src/styles/components/lookbook/lookbook.css` (imported in `allCssImport.css`), `components/common/ProductCard.jsx` (`listId`), `app/lookbook/{page,[slug]/page,[slug]/lookbook-client}.jsx`, `app/sitemap.js`, `utils/analytics-events.js`, `next.config.mjs` (media CDN hosts); `test/lookbook.test.mjs` (7). `npm test` 67 pass; `next build` passes; the kit's `zcom-live-check` against Kesar & Kin (store-scoped local backend) 33/33. Not reviewed in a browser. |
