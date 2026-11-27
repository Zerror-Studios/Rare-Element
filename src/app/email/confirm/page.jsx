/**
 * Email confirmation (backend PRD-050 FR-3.6, FR-3.8: double opt-in)
 *
 * Target of the link in the `consent_confirm` email:
 * `/email/confirm?token=…`. Never indexed, and kept out of the crawl in
 * `robots.js` (a crawler that runs scripts would confirm).
 */

import React, { Suspense } from "react";
import ConfirmClient from "./confirm-client";

export const metadata = {
  title: "Confirm your subscription – Nahara",
  description: "Confirm your Nahara email subscription.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/email/confirm" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmClient />
    </Suspense>
  );
}
