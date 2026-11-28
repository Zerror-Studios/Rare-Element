/**
 * Delivery update (backend PRD-051 FR-12)
 *
 * Target of the "Change address" link in the delivery-failed WhatsApp and
 * email: `/delivery/update?token=…`. The shopper enters a new address,
 * phone or day for the courier's next attempt. Never indexed.
 */

import React, { Suspense } from "react";
import DeliveryUpdateClient from "./delivery-update-client";

export const metadata = {
  title: "Update your delivery – Nahara",
  description: "Change the address, phone or day for your Nahara delivery.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/delivery/update" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeliveryUpdateClient />
    </Suspense>
  );
}
