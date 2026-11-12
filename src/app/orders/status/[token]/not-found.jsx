/**
 * An unknown, mistyped or replaced order status link (backend PRD-041
 * §7): a 404 that points the shopper at the store, never at anyone's
 * order.
 */

import React from "react";
import Link from "next/link";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { SUPPORT_EMAIL } from "@/utils/env";

export const metadata = {
  title: "Order not found | Nahara",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function OrderStatusNotFound() {
  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl font-bold">We couldn&apos;t find this order</h1>
        <p className="uppercase mt-2">
          This order link isn&apos;t valid any more. Check the latest email
          about your order, or contact us and we&apos;ll help.
        </p>
        <p className="mt-4">Contact us at:</p>
        <Link className="underline block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </Link>
        <div className="w-full mt-8 flex flex-col payment_failed_actions">
          <GreenBoxBtn type="button" title="Contact us" href="/contact" />
          <GreenBoxBtn type="button" title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
}
