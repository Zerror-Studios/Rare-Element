# PRD-045 — Merchandising order and desktop + mobile banners (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** in the working tree 2026-11-16 (this repo's part of FR-4 and FR-7); not committed, not browser-tested, not run against a backend with PRD-045 deployed |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-045-merchandising-order-and-banners.md`](../../../../zcom-backend/docs/prd/PRD-045-merchandising-order-and-banners.md) |
| Approved by / on | Anand (owner), backend PRD-045 |
| Needs | The backend's PRD-045 deploy **before** this store's (the store's own `GetClientSideCategory` selects `Category.banner`). Kit **1.4.0** is optional: the code reads every new field defensively and works on 1.3.0 (`package.json` unchanged) |

This file holds only Nahara's notes. Requirements, contract and decisions are in the backend PRD.

## As built

- **Collection order (D2).** The category page's default list is `Category.products` (`GetClientSideCategory`), which the backend now orders by the collection's `sortMode`, the merchant's manual order included. No `sort` is sent for it; only a shopper's choice in the sort select goes to `getClientSideProducts` with `sort`. Nothing changed in code for this.
- **Banners (FR-7).** `components/common/ResponsiveHeroImage.jsx`: without a mobile image, the same `next/image` (`fill`, `priority`, `fetchPriority="high"`) as before; with one, a `<picture>` from `getImageProps` with `<source media="(max-width: 749.98px)">` (the store's 750 px breakpoint), so the browser downloads one file. Used by the category hero (`banner.desktop` / `banner.mobile`, else `imgsrc`) and the lookbook detail cover (`cover`, `coverMobile`, else the cover's own `mobile`).
- **Focal point.** `focalPoint` (banner) and `focalX` / `focalY` (lookbook) become `--hero-pos-desktop` / `--hero-pos-mobile`, which `.responsive_hero_img` (`styles/components/products/products.css`) applies as `object-position` per breakpoint. `crop` (second pass, 2026-11-16) becomes `--hero-view-*` / `--hero-viewpos-*` (`toHeroImageStyle`): inside `@supports (object-view-box: inset(0%))` the hero shows only the crop, with the focal point placed inside it; browsers without `object-view-box` (Safari, Firefox today) keep the whole image centred on the focal point, else the crop's centre. A desktop crop never reaches a separate mobile image.
- **Pairs.** `utils/responsive-image.js` (`getCategoryBanner`, `getLookbookCover`, `toObjectPosition`), tested in `test/responsive-image.test.mjs`; the Deveshe Dreams twin is `utils/responsive-image.util.js`.
- **Product cards (FR-4).** Unchanged: `ProductCard` already shows the featured image (with a hover image), else the first.
- **Sort select (second pass, owner approved 2026-11-16).** From kit 1.4.0 the select's default is "Featured" (`FEATURED`, the collection's own order, never sent to the API) and "Newest" is an explicit `?sort=NEWEST`; the store needs no code change, only the kit pin. `test/listing-sort.test.mjs` is written against `DEFAULT_LISTING_SORT`, so it passes on 1.3.0 and 1.4.0.

## Open

- Browser check on a phone and a desktop width once the backend is deployed; then pin kit `v1.4.0`.
