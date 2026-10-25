"use client";

/**
 * Payment return (PRD-011 FR-4.3)
 *
 * The shopper lands here from `/api/payments/return` after a redirect or
 * form-post payment app (PayU, Cashfree redirects). `ref` names the
 * provider order; `verifyPayment` asks the provider server to server,
 * then the shopper goes to thank-you (PAID or still pending) or
 * payment-failed. Runs once per visit.
 */

import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import Loader from "@/components/checkout/Loader";
import { VERIFY_PAYMENT } from "@/graphql";
import { getErrorInfo } from "@/utils/errors";
import { PendingOrder } from "@/utils/pending-order";
import {
  CheckoutStepEnum,
  trackCheckoutError,
} from "@/utils/analytics-events";

const PaymentReturnClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const orderId = searchParams.get("orderId");
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const failed = (reason, id) => {
      trackCheckoutError(CheckoutStepEnum.PAYMENT, reason);
      const params = new URLSearchParams({ reason });
      if (id) params.set("orderId", id);
      router.replace(`/checkout/payment-failed?${params.toString()}`);
    };

    if (!ref) {
      failed("VERIFY_FAILED", orderId);
      return;
    }
    (async () => {
      try {
        const { data } = await verifyPayment({
          variables: { payload: { providerOrderId: ref } },
        });
        const result = data?.verifyPayment || {};
        const verifiedOrderId = result.orderId || orderId;
        if (result.success || result.status === "PENDING") {
          PendingOrder.clear();
          router.replace(`/checkout/thank-you?orderId=${verifiedOrderId}`);
          return;
        }
        failed(result.status || "FAILED", verifiedOrderId);
      } catch (error) {
        const { reason, code } = getErrorInfo(error);
        if (reason === "ALREADY_PAID" && orderId) {
          PendingOrder.clear();
          router.replace(`/checkout/thank-you?orderId=${orderId}`);
          return;
        }
        failed(reason || code || "VERIFY_FAILED", orderId);
      }
    })();
  }, [ref, orderId, router, verifyPayment]);

  return <Loader isLoading />;
};

export default PaymentReturnClient;
