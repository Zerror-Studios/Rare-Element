/**
 * Back-in-stock confirmation (PRD-020, child-PRD review CP-22)
 *
 * Target of the link in the `back_in_stock_confirm` email:
 * `/back-in-stock/confirm?token=…`. Never indexed, and kept out of the
 * crawl in `robots.js` (a crawler that runs scripts would confirm).
 */

import React, { Suspense } from "react";
import ConfirmClient from "./confirm-client";

export const metadata = {
  title: "Confirm your alert – Nahara",
  description: "Confirm your Nahara back-in-stock alert.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/back-in-stock/confirm" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmClient />
    </Suspense>
  );
}
