import React, { Suspense } from "react";
import PaymentFailedClient from "./payment-failed-client";

export const metadata = {
  title: "Payment Failed | Please Try Again – Nahara",
  description: "Your payment could not be processed. Please retry or choose an alternative payment method to complete your Nahara jewellery order.",
  keywords: ["payment failed", "transaction error", "Nahara payment issue", "checkout error"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedClient />
    </Suspense>
  );
}
