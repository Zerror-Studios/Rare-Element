"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ORDER_BY_ID } from "@/graphql";
import { trackEcomEvent } from "@/utils/analytics";
import * as fpixel from "@/lib/fpixel";

export default function PurchaseTracker() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { data: orderData } = useQuery(GET_ORDER_BY_ID, {
    variables: { getClientSidePaymentByOrderIdId: orderId },
    skip: !orderId,
  });

  useEffect(() => {
    if (orderData?.getClientSidePaymentByOrderId) {
      const orderInfo = orderData.getClientSidePaymentByOrderId;
      const order = orderInfo.order;

      // GA4 Purchase Event
      trackEcomEvent.purchase(
        order._id,
        order.totalprice,
        order.cart || [],
        order.shippingAmount || 0,
        order.taxAmount || 0
      );

      // Facebook Pixel Purchase Event
      fpixel.event("Purchase", {
        currency: "INR",
        value: order.totalprice,
        content_ids: (order.cart || []).map(item => item.productId),
        content_type: 'product',
      });
    } else if (!orderId) {
       // Fallback for direct pixel event if no orderId found (existing behavior)
       fpixel.event("Purchase", {
         currency: "INR",
       });
    }
  }, [orderData, orderId]);

  return null;
}
