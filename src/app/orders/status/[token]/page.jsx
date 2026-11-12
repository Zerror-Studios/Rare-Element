/**
 * /orders/status/[token] — the order status page (backend PRD-041 FR-13,
 * FR-14, FR-17). The order emails link here, a guest lands here after
 * paying, and Account › Orders links a customer's own orders here.
 *
 * Read on the server with the kit's `getOrderStatus` (never cached, the
 * shopper's IP sent for the per-IP limit). An unknown or rotated token is
 * a 404 with the store's contact (`not-found.jsx`). The token is the
 * credential: the page is never indexed and never sent on as a referrer
 * (the kit's proxy sets `X-Robots-Tag`, `no-store` and `no-referrer`; the
 * metadata says so too), and the canonical never carries it.
 */

import { notFound } from "next/navigation";
import { getOrderStatus } from "@zcom/storefront-kit/server";
import { getErrorKey } from "@zcom/storefront-kit/core";
import OrderStatusView from "@/components/orderStatus/OrderStatusView";

// ─── Metadata ─────────────────────────────────────────────────────────────

export const metadata = {
  title: "Your order | Nahara",
  description: "The status of your Nahara order.",
  alternates: { canonical: "/orders/status" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// A shopper's link: read per request
export const dynamic = "force-dynamic";

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function Page({ params }) {
  const { token } = await params;
  let status = null;
  let errorKey = null;
  try {
    status = await getOrderStatus(typeof token === "string" ? token : "");
  } catch (error) {
    // Rate limit or an outage: say so, never a 404 for a good link
    errorKey = getErrorKey(error);
  }
  if (!status && !errorKey) notFound();
  return <OrderStatusView status={status} errorKey={errorKey} />;
}
