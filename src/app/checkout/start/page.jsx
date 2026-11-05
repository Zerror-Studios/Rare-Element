import React from "react";
import CheckoutStartClient from "./checkout-start-client";

// PRD-034 FR-1.9: `/checkout/start?products=<variantId>:<qty>,…` fills the
// bag and opens checkout (the Meta checkout URL). Per-shopper: dynamic,
// never indexed.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preparing your bag",
  robots: "noindex,nofollow",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  return <CheckoutStartClient products={params?.products ?? ""} />;
}
