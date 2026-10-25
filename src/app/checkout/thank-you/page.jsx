import React, { Suspense } from "react";
import ThankYouClient from "./thank-you-client";

export const metadata = {
  title: "Order Successful | Thank You for Shopping at Nahara",
  description: "Your order has been placed successfully at Nahara. Thank you for choosing our handcrafted luxury jewellery. A confirmation has been sent to your email.",
  keywords: ["Nahara order success", "thank you page", "order confirmation", "Nahara jewellery purchase"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ThankYouClient />
    </Suspense>
  );
}
