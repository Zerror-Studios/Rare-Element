# PRD-029 — Retire Nimbbl and choose the default payment app (pointer)

| Field | Value |
|---|---|
| Status | Source PRD **Draft**; this store's part is the D1 window only, **implemented** 2026-11-11 (not browser-tested, no real payment made yet) |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-029-retire-nimbbl.md`](../../../../zcom-backend/docs/prd/PRD-029-retire-nimbbl.md) |
| Approved by / on | Anand (owner), 2026-11-11, D1: "deveshe and nahara on microservice or new architecture should use nimbbl. Because we have Pitch tomorrow to show running store with complete flow with our new system." |

## In this storefront

- Until Nimbbl's shutdown on 2026-11-15 the store pays through its installed Nimbbl app on the new system: the kit (1.0.4+) `launchPayment` opens `nimbbl_sonic` (^6.3.3, a dependency again), registered once in `app/providers.jsx` with `registerNimbblCheckout`; the module loads only when the shopper pays. The kit's CSP lists `*.nimbbl.tech`, `*.openfpcdn.io` and `checkip.amazonaws.com` for it.
- Without a registration, or for another provider, nothing changes (Razorpay, Cashfree, PayU as before).
- After the shutdown (PRD-029 FR-5): remove the registration and `nimbbl_sonic`, and move to the chosen app (Q1).

## Implementation log

| Date | Entry |
|---|---|
| 2026-11-11 | `nimbbl_sonic` ^6.3.3 and kit 1.0.4 (then 1.0.5) installed; `registerNimbblCheckout` in `app/providers.jsx`; comments in the payment launcher wrapper updated. Local test on a store-scoped backend: Nahara reached a PRODUCTION Nimbbl payment session (₹11,500, SDK token). |
