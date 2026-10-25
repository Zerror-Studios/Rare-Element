/**
 * Payment checkout (PRD-011 FR-4.1)
 * Keep in sync with deveshe-dreams `utils/payment-checkout.util.js`.
 *
 * One payment step for every payment app: `createPaymentSession` returns a
 * provider-neutral `checkout`, and this opens it.
 * - SDK: the provider's script loads on demand from `checkout.scriptUrl`
 *   (Razorpay Checkout.js, Cashfree JS); Nimbbl uses the bundled
 *   `nimbbl_sonic`, imported only when needed.
 * - REDIRECT: the browser goes to `checkout.redirectUrl`.
 * - FORM_POST: `checkout.formFields` are posted to `checkout.formAction`
 *   (PayU); PayU sends the shopper back to `/api/payments/return`.
 *
 * `onResult(payload)` gets what the provider returned plus our
 * `paymentId`, ready for `verifyPayment`; `onDismiss()` runs when the
 * shopper closes the window without paying. Nothing here is trusted: the
 * backend checks every result with the provider.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const NIMBBL_EVENTS = ["globalHandleCheckoutResponse", "globalCloseCheckoutModal"];
const SCRIPT_TIMEOUT_MS = 20 * 1000;

// ─── Script loader ────────────────────────────────────────────────────────

const scriptLoads = new Map();

/** Loads a provider script once; later calls reuse the same promise. */
function loadScript(src) {
  if (!src) return Promise.reject(new Error("No checkout script"));
  if (scriptLoads.has(src)) return scriptLoads.get(src);
  const loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      reject(new Error("The payment window took too long to load"));
    }, SCRIPT_TIMEOUT_MS);
    script.src = src;
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      scriptLoads.delete(src);
      reject(new Error("The payment window could not be loaded"));
    };
    document.body.appendChild(script);
  });
  scriptLoads.set(src, loading);
  return loading;
}

// ─── Providers ────────────────────────────────────────────────────────────

async function openRazorpay(checkout, { paymentId, onResult, onDismiss }) {
  await loadScript(checkout.scriptUrl);
  const razorpay = new window.Razorpay({
    ...checkout.sdk,
    handler: (response) => onResult({ paymentId, ...response }),
    modal: { ondismiss: () => onDismiss() },
  });
  // A failed attempt keeps the window open so the shopper can retry
  razorpay.open();
}

async function openCashfree(checkout, { paymentId, onResult, onDismiss }) {
  await loadScript(checkout.scriptUrl);
  const cashfree = window.Cashfree({ mode: checkout.sdk?.mode });
  const result = await cashfree.checkout({
    paymentSessionId: checkout.sdk?.paymentSessionId,
    redirectTarget: "_modal",
  });
  if (result?.redirect) return;
  if (result?.paymentDetails) {
    onResult({ paymentId, order_id: checkout.sdk?.orderId });
    return;
  }
  // Closed or errored before a payment: the order stays for a retry (a
  // payment that did go through is settled by the webhook or enquiry)
  onDismiss();
}

async function openNimbbl(checkout, { paymentId, onResult, onDismiss }) {
  const { default: NimbblCheckout } = await import("nimbbl_sonic");
  let handled = false;
  const sonic = new NimbblCheckout({ token: checkout.sdk?.token });
  sonic.open({
    callback_handler: async (response) => {
      if (handled || !NIMBBL_EVENTS.includes(response?.event_type)) return;
      handled = true;
      if (response?.payload) {
        onResult({ paymentId, ...response.payload });
        return;
      }
      onDismiss();
    },
  });
}

function submitForm(checkout) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.formAction;
  for (const [name, value] of Object.entries(checkout.formFields || {})) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

// ─── Entry point ──────────────────────────────────────────────────────────

/**
 * Opens the checkout of a payment session. Throws when the session has
 * nothing the storefront can open.
 */
export async function openPaymentCheckout(session, handlers) {
  const checkout = session?.checkout;
  const context = { paymentId: session?.paymentId, ...handlers };
  if (!checkout) throw new Error("No payment checkout");

  if (checkout.mode === "REDIRECT" && checkout.redirectUrl) {
    window.location.assign(checkout.redirectUrl);
    return;
  }
  if (checkout.mode === "FORM_POST" && checkout.formAction) {
    submitForm(checkout);
    return;
  }
  if (checkout.mode === "SDK") {
    if (checkout.provider === "RAZORPAY") return await openRazorpay(checkout, context);
    if (checkout.provider === "CASHFREE") return await openCashfree(checkout, context);
    if (checkout.provider === "NIMBBL") return await openNimbbl(checkout, context);
  }
  throw new Error(`Unsupported payment checkout: ${checkout.provider} ${checkout.mode}`);
}
