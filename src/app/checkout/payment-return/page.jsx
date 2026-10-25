import React, { Suspense } from "react";
import PaymentReturnClient from "./payment-return-client";

export const metadata = {
  title: "Confirming Your Payment | Nahara",
  description: "We are confirming your payment with the payment provider.",
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnClient />
    </Suspense>
  );
}
