import CheckoutClient from "./checkout-client";

/**
 * /checkout: one page for the shopper's own bag (Contact, Delivery,
 * Payment). The bag comes from the session or the tab's guest cart, never
 * from the URL: a cart id in the path went stale when sign-in merged the
 * guest bag (an empty checkout), and it leaked into history, referrers and
 * analytics page paths. There is no `/checkout/<id>` route any more.
 */

export const metadata = {
  title: "Checkout – Complete Your Nahara Jewellery Purchase",
  description: "Secure checkout for purchasing fine jewellery from Nahara. Fast delivery, trusted payments.",
  keywords: ["Nahara checkout", "jewellery checkout", "secure payment"],
  robots: "noindex, nofollow",
  alternates: { canonical: "/checkout" },
};

export default function Page() {
  return <CheckoutClient />;
}
