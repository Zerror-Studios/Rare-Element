/**
 * Reset password (PRD-003 FR-0.5)
 *
 * Target of the link in the reset email:
 * `/reset-password?token=…&email=…`. Never indexed.
 */

import React, { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export const metadata = {
  title: "Reset Password – Nahara",
  description: "Choose a new password for your Nahara account.",
  robots: "noindex, nofollow",
  alternates: { canonical: "/reset-password" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
