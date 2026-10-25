# PRD-019: GST invoicing, storefront (pointer)

| Field | Value |
|---|---|
| Status | **Approved** 2026-10-26. Not started. Tax content is gated on the owner's CA (backend PRD §8.1, §9) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-019-gst-invoicing.md`](../../../../zcom-backend/docs/prd/PRD-019-gst-invoicing.md) |
| Approved by / on | Anand (owner), 2026-10-26: "please review and approve the six drafted follow-up PRDs" (every §8 recommendation accepted) |
| Rollout step | Backend §7.1 step 4 (one storefront at a time, after backend Phase 2); checked per root `CLAUDE.md` §5.5 |

Only this repo's notes are here; requirements, contract and decisions live in the backend PRD.

## This repo's part
- **Order page "Documents":** list `myOrder.taxDocuments` (Tax invoice, Credit note), each with "Download (PDF)" that calls `myTaxDocumentDownloadUrl(orderId, documentId)` on click and opens the URL; never embed it in the HTML or cache it. `src/app/account/order/[id]/order-detail-client.jsx` replaces its "Download Invoice" link (shown only for a real legacy URL since PRD-014 Wave 2).
- **Checkout (B2B, optional):** a collapsed "Add GSTIN for a business purchase (optional)" with GSTIN and legal name, sent as `createCheckoutSessionFromCart(buyer: …)`, shown only when `getStorefrontTaxDisplay.gstMode` is true; the inline message comes from `extensions.reason` (`INVALID_GSTIN`). Placement: the checkout address/summary step.
- **"(Incl. of all taxes)"** in `components/product/ProductContant.jsx` and `components/cart/CartItem.jsx` becomes conditional on `getStorefrontTaxDisplay.pricesIncludeTax`.
- In a GST-mode store the order's `tax.breakdown` names become "CGST 9%" and similar; the existing breakdown rendering must still read well.
- All new fields are additive and optional, so the storefront keeps working before this lands; contract validation (`npm run validate:clients`) must pass after.

## Implementation log
_Not started._
