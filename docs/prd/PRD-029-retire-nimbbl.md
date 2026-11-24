# PRD-029 — Retire Nimbbl and choose the default payment app (pointer)

| Field | Value |
|---|---|
| Status | Source PRD **Approved for FR-5 removal** (D3, 2026-11-23); this store's D1 window was implemented 2026-11-11 and its D3 removal **implemented** 2026-11-23 (not browser-tested) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-029-retire-nimbbl.md`](../../../../zcom-backend/docs/prd/PRD-029-retire-nimbbl.md) |
| Approved by / on | Anand (owner), 2026-11-23, D3: "Remove the Nimbbl App Provider from the app" → "Delete all Nimbbl code". Earlier, 2026-11-11, D1: "deveshe and nahara on microservice or new architecture should use nimbbl. Because we have Pitch tomorrow to show running store with complete flow with our new system." |

## In this storefront

- **Since 2026-11-23 (D3):** Nimbbl is gone. No `registerNimbblCheckout` call and no `nimbbl_sonic` dependency; the kit's `launchPayment` fails a NIMBBL checkout (`PAYMENT_PROVIDER_UNSUPPORTED`) and the backend refuses to open one (`CONFLICT` / `PAYMENT_PROVIDER_NOT_CONFIGURED`), so the store pays only through another primary app (Razorpay, Cashfree, PayU or CCAvenue). The store stays on kit 1.6.0 (which still exports `registerNimbblCheckout`, unused); kit 2.0.0 removes it and its CSP hosts.

**History (the D1 window, 2026-11-11 to 2026-11-15):**

- Until Nimbbl's shutdown on 2026-11-15 the store pays through its installed Nimbbl app on the new system: the kit (1.0.4+) `launchPayment` opens `nimbbl_sonic` (^6.3.3, a dependency again), registered once in `app/providers.jsx` with `registerNimbblCheckout`; the module loads only when the shopper pays. The kit's CSP lists `*.nimbbl.tech`, `*.openfpcdn.io` and `checkip.amazonaws.com` for it.
- Without a registration, or for another provider, nothing changes (Razorpay, Cashfree, PayU as before).
- After the shutdown (PRD-029 FR-5): remove the registration and `nimbbl_sonic`, and move to the chosen app (Q1).

## Implementation log

| Date | Entry |
|---|---|
| 2026-11-11 | `nimbbl_sonic` ^6.3.3 and kit 1.0.4 (then 1.0.5) installed; `registerNimbblCheckout` in `app/providers.jsx`; comments in the payment launcher wrapper updated. Local test on a store-scoped backend: Nahara reached a PRODUCTION Nimbbl payment session (₹11,500, SDK token). |
| 2026-11-23 | D3: `registerNimbblCheckout` call and import removed from `app/providers.jsx`, Nimbbl comments removed from the checkout files, `npm uninstall nimbbl_sonic` (lockfile: 30 packages gone). Kit pin unchanged (v1.6.0); bump to v2.0.0 once it is tagged, which also drops the Nimbbl CSP hosts. `npm test` 164/164. |
