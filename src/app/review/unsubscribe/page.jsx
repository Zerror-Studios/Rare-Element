/**
 * Review request opt-out (PRD-032 FR-R5)
 *
 * Target of the footer link in `review_request` emails:
 * `/review/unsubscribe?email=…&token=…`. Never indexed.
 */

import React, { Suspense } from "react";
import ReviewUnsubscribeClient from "./unsubscribe-client";

export const metadata = {
  title: "Review emails – Nahara",
  description: "Stop review request emails from Nahara.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/review/unsubscribe" },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReviewUnsubscribeClient />
    </Suspense>
  );
}
