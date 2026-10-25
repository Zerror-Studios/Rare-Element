"use client";

/**
 * Purchase analytics (PRD-002 SF-13): fires GA4 `purchase` and the Meta
 * `Purchase` event once per paid order. The thank-you page passes the
 * order only after `myOrder` reports it PAID; a sessionStorage key per
 * order id stops repeats on refresh or back-navigation in this tab.
 */

import { useEffect } from "react";
import { trackEcomEvent } from "@/utils/analytics";
import * as fpixel from "@/lib/fpixel";

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

    // GA4 Purchase Event
    trackEcomEvent.purchase(
      order._id,
      value,
      order.cart || [],
      order.shippingAmount || 0,
      order.tax?.totalTax || 0
    );

    // Facebook Pixel Purchase Event
    fpixel.event("Purchase", {
      currency: order.currency || "INR",
      value,
      content_ids: (order.cart || []).map((item) => item.productId),
      content_type: "product",
    });
  }, [order]);

  return null;
}
