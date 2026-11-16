# PRD-046 — Track inventory and continue selling (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** in the working tree 2026-11-16 (this repo's part of FR-20); not committed, not browser-tested, not run against a backend with PRD-046 deployed |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-046-track-inventory-and-continue-selling.md`](../../../../zcom-backend/docs/prd/PRD-046-track-inventory-and-continue-selling.md) |
| Approved by / on | Anand (owner), backend PRD-046 (2026-11-16) |
| Needs | Nothing new from the API: the PRD-020 stock signal starts emitting `BACKORDER` once the backend's PRD-046 is deployed. Works on kit 1.3.0 and 1.4.0 (`package.json` unchanged) |

This file holds only Nahara's notes. Requirements, contract and decisions are in the backend PRD.

## As built

- **Copy:** "Available on backorder" (`BACKORDER_LABEL`), shown on the product page when the chosen variant's signal is `BACKORDER`, or, before a variant is chosen, when the product's rollup `Product.availability` is `BACKORDER`. "Add To Cart" stays enabled (a backorder is never sold out). Wired in `app/products/[slug]/product-client.jsx` (rendered by `components/product/ProductContant.jsx` in the existing `.productDetail_stock_note` line, under the options and above the buttons); no new styling.
- **Helpers:** `isBackorder(signal)` and `getBackorderNote(signal)` in `utils/stock-signal.js`. They read `availability` directly, because kit 1.3.0 has no `isBackorder` (new in kit 1.4.0). Every other helper is the kit's, which already treats `BACKORDER` as buyable: not sold out, no "Low stock" note, no listing badge, choice not struck through, cart line not blocked, analytics `in_stock` true, schema.org `BackOrder`.
- **Untracked variants** (`availability: null`) look exactly as before (no signal).
- **Tests:** `test/stock-signal.test.mjs` "backorder" (kept in sync with the other store's copy). `npm test` 148/148.

## Open

- Browser check once the backend's PRD-046 is deployed and a store turns on "Continue selling" for a variant.
