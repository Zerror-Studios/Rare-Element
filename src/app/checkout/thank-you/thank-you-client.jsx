"use client";

/**
 * Thank-you (PRD-002 SF-13): the order state comes from `myOrder`, not
 * from the URL. PAID is set asynchronously after `verifyPayment`, so an
 * UN_PAID order is polled for a short while and shown as "processing".
 * When polling ends without PAID the page settles on a terminal "not
 * confirmed yet" state with the support contact (RBUG-20); a missing or
 * unknown order never shows success.
 *
 * The checkout lands here only when the order has no status page token
 * (else it goes to `orderStatusPath`, backend PRD-041 FR-14). Once PAID,
 * `PurchaseTracker` sends the ads purchase, which the kit dedupes per
 * order (the paying tab already sent it); GA4's `purchase` is sent
 * server-side by the backend (PRD-012), never from here.
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import PurchaseTracker from "@/components/checkout/PurchaseTracker";
import { MY_ORDER } from "@/graphql";
import { SUPPORT_EMAIL } from "@/utils/env";
import { PendingOrderStore } from "@zcom/storefront-kit/core";

const POLL_INTERVAL_MS = 3000;
const POLL_DURATION_MS = 60 * 1000;

const ThankYouClient = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { data, loading, error, startPolling, stopPolling } = useQuery(MY_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
    fetchPolicy: "network-only",
  });
  const order = data?.myOrder;
  const isPaid = order?.paymentStatus === "PAID";
  const [pollingEnded, setPollingEnded] = useState(false);

  const loadedOrderId = order?._id;
  useEffect(() => {
    if (!loadedOrderId || isPaid) {
      stopPolling();
      return;
    }
    startPolling(POLL_INTERVAL_MS);
    const timeout = setTimeout(() => {
      stopPolling();
      setPollingEnded(true);
    }, POLL_DURATION_MS);
    return () => {
      clearTimeout(timeout);
      stopPolling();
    };
  }, [loadedOrderId, isPaid, startPolling, stopPolling]);

  // The order is paid: a later checkout must not reuse the kit's kept
  // unpaid order (RBUG-8; the kit also forgets it once PAID).
  useEffect(() => {
    if (isPaid) PendingOrderStore.clear();
  }, [isPaid]);

  let title = "Payment Successful";
  let subtitle = "Thank you for your purchase";
  let image = "/gifs/success.gif";
  if (!orderId || (!loading && (error || !order))) {
    title = "We couldn't find this order";
    subtitle = "Check your orders in your account, or contact us.";
    image = "/gifs/payment_failed.webp";
  } else if (loading && !order) {
    title = "Confirming your order…";
    subtitle = "This only takes a moment";
    image = null;
  } else if (!isPaid && pollingEnded) {
    title = "Payment not confirmed yet";
    subtitle =
      "We haven't received confirmation from the bank. If money left your " +
      "account, contact us with your order number before paying again.";
    image = "/gifs/payment_failed.webp";
  } else if (!isPaid) {
    title = "Payment processing";
    subtitle = "We are confirming your payment. This page updates automatically.";
    image = null;
  }

  return (
    <div className="status_section center">
      {isPaid && <PurchaseTracker order={order} />}
      <div className="status_section_inner">
        {image && (
          <div className="status_img_pren center">
            <Image height={200} width={200} className="cover" src={image} alt="" />
          </div>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="uppercase mt-2">{subtitle}</p>
        {order?.orderNo && <p className="mt-2">Order: {order.orderNo}</p>}
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline text-blue-600 block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
        <div className="w-full mt-8">
          <GreenBoxBtn title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
};

export default ThankYouClient;
