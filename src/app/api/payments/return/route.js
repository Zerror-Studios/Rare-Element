/**
 * Payment return (PRD-011 FR-4.3)
 *
 * Where redirect and form-post payment apps send the shopper back: PayU
 * POSTs its response here (`surl` / `furl`), Cashfree redirects here with
 * `order_id`. A cross-site POST carries no session cookie, so nothing is
 * verified here: the route only reads which payment it was and sends the
 * browser (303, a GET that carries the cookie) to `/checkout/payment-return`,
 * which calls `verifyPayment`. The backend confirms the status with the
 * provider; nothing in this request is trusted.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Constants ────────────────────────────────────────────────────────────

const RETURN_PAGE_PATH = "/checkout/payment-return";
const PROVIDER_ORDER_KEYS = ["txnid", "order_id", "razorpay_order_id", "providerOrderId"];
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const SAFE_REF_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const KNOWN_PROVIDERS = ["payu", "cashfree", "razorpay", "nimbbl"];

// ─── Helpers ──────────────────────────────────────────────────────────────

async function readFields(request) {
  const fields = Object.fromEntries(request.nextUrl.searchParams);
  if (request.method !== "POST") return fields;
  try {
    const form = await request.formData();
    for (const [name, value] of form.entries()) {
      if (typeof value === "string") fields[name] = value;
    }
  } catch {
    // Not a form body: the query is all there is.
  }
  return fields;
}

async function handleReturn(request) {
  const fields = await readFields(request);
  const url = request.nextUrl.clone();
  url.pathname = RETURN_PAGE_PATH;
  url.search = "";

  const provider = String(fields.provider || "").toLowerCase();
  if (KNOWN_PROVIDERS.includes(provider)) url.searchParams.set("provider", provider);
  const ref = PROVIDER_ORDER_KEYS.map((key) => fields[key]).find(
    (value) => typeof value === "string" && SAFE_REF_PATTERN.test(value),
  );
  if (ref) url.searchParams.set("ref", ref);
  // PayU echoes our order id in udf1
  if (OBJECT_ID_PATTERN.test(String(fields.udf1 || ""))) {
    url.searchParams.set("orderId", fields.udf1);
  }
  return NextResponse.redirect(url, 303);
}

// ─── Handlers ─────────────────────────────────────────────────────────────

export async function GET(request) {
  return await handleReturn(request);
}

export async function POST(request) {
  return await handleReturn(request);
}
