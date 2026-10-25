"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { useCartStore } from "@/store/cart-store";
import { SUPPORT_EMAIL } from "@/utils/env";
import { PendingOrder } from "@/utils/pending-order";

// Reasons set by the checkout client (SF-12).
const FAILURE_MESSAGES = {
  VERIFY_FAILED:
    "We couldn't confirm your payment. If money was deducted, it is reconciled automatically; please check your order or contact us.",
  NO_PAYMENT_SESSION: "We couldn't start the payment. Please try again.",
  FAILED: "Unfortunately, your payment could not be processed.",
};

// PRD-014 (as deveshe-dreams FR-0.12): the unpaid order is kept for its bag
// (`utils/pending-order.js`). "Retry payment" goes back to that bag's
// checkout, which reuses the same order while the bag, email and addresses
// are unchanged; "Back to cart" opens the bag drawer.
const PaymentFailedClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openCart } = useCartStore((state) => state);
  const [retryCartId, setRetryCartId] = useState(null);
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  const message = FAILURE_MESSAGES[reason] || FAILURE_MESSAGES.FAILED;

  // sessionStorage is browser-only, so the lookup runs after mount.
  useEffect(() => {
    setRetryCartId(PendingOrder.findCartId(orderId));
  }, [orderId]);

  const handleRetry = () => {
    if (!retryCartId) return;
    router.push(`/checkout/${encodeURIComponent(retryCartId)}`);
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
          {retryCartId
            ? " Your order is saved, so you can retry the payment."
            : " Your bag is saved, so you can check out again."}
        </p>
        {orderId && (
          <Link className="underline block mt-2" href={`/account/order/${orderId}`}>View order</Link>
        )}
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
        <div className="w-full mt-8 flex flex-col payment_failed_actions">
          {retryCartId && (
            <GreenBoxBtn type="button" title="Retry payment" onClick={handleRetry} />
          )}
          <GreenBoxBtn type="button" title="Back to cart" onClick={openCart} />
          <GreenBoxBtn type="button" title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedClient;
