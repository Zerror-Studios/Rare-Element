/**
 * Review your order (PRD-032 FR-R3, FR-D3)
 *
 * Target of the link in the `review_request` email:
 * `/review?token=…`. Reviews every product of that one order without a
 * login. Never indexed, and kept out of the crawl in `robots.js`.
 */

import React, { Suspense } from "react";
import ReviewLinkClient from "./review-link-client";

export const metadata = {
  title: "Review your order – Nahara",
  description: "Tell other shoppers what you think of your Nahara order.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/review" },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReviewLinkClient />
    </Suspense>
  );
}
