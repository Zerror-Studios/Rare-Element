"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { SUPPORT_EMAIL } from "@/utils/env";

// Reasons set by the checkout client (SF-12).
const FAILURE_MESSAGES = {
  VERIFY_FAILED:
    "We couldn't confirm your payment. If money was deducted, it is reconciled automatically; please check your order or contact us.",
  NO_PAYMENT_SESSION: "We couldn't start the payment. Please try again.",
  FAILED: "Unfortunately, your payment could not be processed.",
};

const PaymentFailedClient = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  const message = FAILURE_MESSAGES[reason] || FAILURE_MESSAGES.FAILED;

  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <div className="status_img_pren center">
          <Image height={200} width={200} className="cover" src="/gifs/payment_failed.webp" alt="error gif" />
        </div>
        <h1 className="text-3xl font-bold text-red-600">Payment Failed</h1>
        <p className="uppercase mt-2">{message}</p>
        {orderId && (
          <Link className="underline block mt-2" href={`/account/order/${orderId}`}>View order</Link>
        )}
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline text-blue-600 block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
        <div className="w-full mt-8">
          <GreenBoxBtn title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedClient;
