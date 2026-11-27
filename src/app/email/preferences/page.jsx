/**
 * Email preferences (backend PRD-050 FR-3.8)
 *
 * Target of the preference link in every email:
 * `/email/preferences?token=…`. Never indexed and kept out of the crawl.
 */

import React, { Suspense } from "react";
import PreferencesClient from "./preferences-client";

export const metadata = {
  title: "Email preferences – Nahara",
  description: "Choose which Nahara emails you receive.",
  robots: "noindex,nofollow",
  alternates: { canonical: "/email/preferences" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PreferencesClient />
    </Suspense>
  );
}
