/**
 * Newsletter unsubscribe (PRD-002 VCON-1)
 *
 * Target of the unsubscribe link in newsletter emails:
 * `/unsubscribe?email=…&token=…`. Never indexed.
 */

import React, { Suspense } from "react";
import UnsubscribeClient from "./unsubscribe-client";

export const metadata = {
  title: "Unsubscribe – Nahara",
  description: "Manage your Nahara newsletter subscription.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/unsubscribe" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeClient />
    </Suspense>
  );
}
