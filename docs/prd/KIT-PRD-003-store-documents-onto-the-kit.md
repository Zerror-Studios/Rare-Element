# KIT-PRD-003 — Store GraphQL documents onto the kit (pointer to the kit's PRD-003)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-11-14 (working tree, not committed; needs kit v1.3.0) · approved 2026-11-14 (D1–D4) |
| Source-of-truth PRD | `../../../../zcom-storefront-kit/docs/prd/PRD-003-store-documents-onto-the-kit.md` (the kit repo; no backend contract change) |
| Repos affected | zcom-storefront-kit · storefronts/rare-element · storefronts/deveshe-dreams · zcom-backend (client manifests only) |

This repo keeps only Nahara's notes. The inventory (every document of this store with its kit equivalent and call sites), the requirements and decisions D1–D4 are in the source PRD.

**In short:** this store's `src/graphql` documents move onto the kit's hooks, server functions and documents, area by area (cart and wishlist; account; reviews; forms and links; catalog reads). Only design-specific reads stay here (≤ 5, each with a one-line reason). The store keeps its own zustand stores and fills them from the kit hooks (D2). Each area goes live after its browser check (D3). Order: Nahara first, then Deveshe Dreams (D1).

## Log

- 2026-11-14 — **Implemented.** Nahara: 47 documents now re-export the kit's (cart, wishlist, account, orders, returns, reviews, back in stock, newsletter, contact, password reset, payment links, products, categories, lookbooks), 2 kept (`GetClientSideCategory`, `GetSitemapProducts`). Tests 137/137, build clean, `validate:clients` 45/45 (60 call sites); Chrome against the live API: 8 key pages, no GraphQL error. Not run: signed-in pages and cart writes in a browser (owner's check before going live, D3). Ships with the kit pin `v1.3.0`.
- 2026-11-14 — FR-1: deleted the 6 unused documents (old login/logout/refresh, merge cart, variant availability, tracking config); FR-6: `test/kit-documents.test.mjs` guards against new duplicates (37 not moved yet, shrink-only). Tests 137/137, build clean, `validate:clients` 49/49.
- 2026-11-14 — Approved; pointer created.
