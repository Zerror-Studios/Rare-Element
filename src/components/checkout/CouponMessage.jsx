"use client";

/**
 * A refused coupon's message, with "Sign in" (back to the checkout) when
 * the code needs an account (`PROMOTION_SIGN_IN_REQUIRED`). Used under the
 * code field and in the checkout's refusal toasts.
 */

import Link from "next/link";
import {
  CHECKOUT_SIGN_IN_PATH,
  isSignInRequiredReason,
} from "@/utils/coupon";

const CouponMessage = ({ message, reason }) => (
  <span>
    {message}
    {isSignInRequiredReason(reason) && (
      <>
        {" "}
        <Link href={CHECKOUT_SIGN_IN_PATH} className="text_decoration_underline">
          Sign in
        </Link>
      </>
    )}
  </span>
);

export default CouponMessage;
