"use client";

/**
 * Purchase analytics (PRD-002 SF-13): fires GA4 `purchase`, the Meta
 * `Purchase` and the Google Ads purchase conversion once per paid order.
 * The thank-you page passes the order only after `myOrder` reports it
 * PAID; a sessionStorage key per order id stops repeats on refresh or
 * back-navigation in this tab.
 *
 * PRD-034 FR-1.3 / FR-1.6: every network gets the order `_id` (GA4 and
 * Google Ads `transaction_id`, Pixel `eventID`), the id the server-side
 * Conversions API uses, so browser and server events deduplicate. The
 * email and phone are passed for enhanced conversions, which hash them in
 * the browser (marketing consent and the store's setting only).
 */

import { useEffect } from "react";
import { trackEcomEvent } from "@/utils/analytics";

const TRACKED_KEY_PREFIX = "zc_purchase_tracked:";

const alreadyTracked = (orderId) => {
  try {
    return sessionStorage.getItem(`${TRACKED_KEY_PREFIX}${orderId}`) === "1";
  } catch {
    return false;
  }
};

const markTracked = (orderId) => {
  try {
    sessionStorage.setItem(`${TRACKED_KEY_PREFIX}${orderId}`, "1");
  } catch {
    // Storage unavailable: the event may repeat on refresh in this tab.
  }
};

export default function PurchaseTracker({ order }) {
  useEffect(() => {
    if (!order?._id || order.paymentStatus !== "PAID") return;
    if (alreadyTracked(order._id)) return;
    markTracked(order._id);

    const value = order.orderPrice || 0;

    const contact = order.billingAddress || order.shippingAddress || {};
    // GA4, Meta Pixel and Google Ads (marketing consent for the ads)
    Promise.resolve(
      trackEcomEvent.purchase(
        order._id,
        value,
        order.cart || [],
        order.shippingAmount || 0,
        order.tax?.totalTax || 0,
        {
          currency: order.currency || "INR",
          customer: {
            email: contact.email || order.shippingAddress?.email,
            phone: contact.phone || order.shippingAddress?.phone,
            countryCode: contact.countryCode,
          },
        },
      ),
    ).catch(() => {});
  }, [order]);

  return null;
}
