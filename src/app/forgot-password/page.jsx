/**
 * Forgot password (PRD-003 FR-0.5)
 *
 * Asks for the account email and calls `customerRequestPasswordReset`. The
 * server answers the same way whether or not an account exists.
 */

import React from "react";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata = {
  title: "Forgot Password – Nahara",
  description: "Request a link to reset your Nahara account password.",
  robots: "noindex, nofollow",
  alternates: { canonical: "/forgot-password" },
};

export default function Page() {
  return <ForgotPasswordClient />;
}
