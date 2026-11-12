"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useCheckout } from "@zcom/storefront-kit/client";
import {
  GuestCheckoutStore,
  PendingOrderStore,
  orderStatusPath,
} from "@zcom/storefront-kit/core";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import Loader from "@/components/checkout/Loader";
import { useCartStore } from "@/store/cart-store";
import { SUPPORT_EMAIL } from "@/utils/env";
import { getKitKeyMessage } from "@/utils/errors";

// Reasons set by the checkouts and the payment return (SF-12).
const FAILURE_MESSAGES = {
  VERIFY_FAILED:
    "We couldn't confirm your payment. If money was deducted, it is reconciled automatically; please check your order or contact us.",
  NO_PAYMENT_SESSION: "We couldn't start the payment. Please try again.",
  FAILED: "Unfortunately, your payment could not be processed.",
};

// PRD-014 FR-0.12 (as deveshe-dreams), backend PRD-041 FR-17: the unpaid
// order is kept by the kit for this tab (`PendingOrderStore`; a guest's
// also with its `GuestCheckoutStore` token). "Retry payment" pays that
// order again right here with the kit's `retryPayment`, signed in or
// guest; once PAID the shopper goes to the order status page (else
// thank-you). Without a kept order "Back to checkout" opens `/checkout`
// (the bag is saved). "Back to cart" opens the bag drawer.

/** The kept unpaid order to retry for `orderId` (any when none is named). */
const findRetryOrderId = (orderId) => {
  const kept = [
    GuestCheckoutStore.get()?.orderId,
    PendingOrderStore.get()?.orderId,
  ];
  return kept.find((id) => id && (!orderId || id === orderId)) || null;
};

const PaymentFailedClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCart } = useCartStore((state) => state);
  const checkout = useCheckout();
  const [retryOrderId, setRetryOrderId] = useState(null);
  const [isGuestOrder, setIsGuestOrder] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  const message = FAILURE_MESSAGES[reason] || FAILURE_MESSAGES.FAILED;

  // sessionStorage is browser-only, so the lookup runs after mount.
  useEffect(() => {
    const id = findRetryOrderId(orderId);
    setRetryOrderId(id);
    setIsGuestOrder(Boolean(id) && GuestCheckoutStore.get()?.orderId === id);
    setIsReady(true);
  }, [orderId]);

  const handleRetry = async () => {
    if (!retryOrderId || checkout.isBusy) return;
    setRetryError("");
    const result = await checkout.retryPayment(retryOrderId);
    if (result.step === "paid" || result.step === "unconfirmed") {
      const path = orderStatusPath(
        result.statusToken ?? GuestCheckoutStore.get()?.statusToken,
      );
      setIsLeaving(true);
      router.replace(
        path ||
          `/checkout/thank-you?orderId=${encodeURIComponent(retryOrderId)}`,
      );
      return;
    }
    if (result.step === "redirecting") {
      setIsLeaving(true);
      return;
    }
    if (result.step === "dismissed") {
      toast.info("Payment was not completed. You can try again.");
      return;
    }
    if (result.step === "failed") {
      setRetryError(getKitKeyMessage(result.reason));
      // The kit forgets an order that can't be paid any more
      setRetryOrderId(findRetryOrderId(orderId));
    }
  };

  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <div className="status_img_pren center">
          <Image height={200} width={200} className="cover" src="/gifs/payment_failed.webp" alt="" />
        </div>
        <h1 className="text-3xl font-bold">Payment Failed</h1>
        <p className="uppercase mt-2">
          {message}
          {retryOrderId
            ? " Your order is saved, so you can retry the payment."
            : " Your bag is saved, so you can check out again."}
        </p>
        {retryError && (
          <p className="mt-2" role="alert">{retryError}</p>
        )}
        {orderId && !isGuestOrder && (
          <Link className="underline block mt-2" href={`/account/order/${orderId}`}>View order</Link>
        )}
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
        <div className="w-full mt-8 flex flex-col payment_failed_actions">
          {retryOrderId ? (
            <GreenBoxBtn
              type="button"
              title="Retry payment"
              loading={checkout.isBusy || isLeaving}
              onClick={handleRetry}
            />
          ) : (
            isReady && (
              <GreenBoxBtn
                type="button"
                title="Back to checkout"
                onClick={() => router.push("/checkout")}
              />
            )
          )}
          <GreenBoxBtn type="button" title="Back to cart" onClick={openCart} />
          <GreenBoxBtn type="button" title="Continue Shopping" href="/" />
        </div>
      </div>
      <Loader isLoading={checkout.step === "verifying" || isLeaving} />
    </div>
  );
};

export default PaymentFailedClient;
