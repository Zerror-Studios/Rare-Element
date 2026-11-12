"use client";

/**
 * The guest checkout's Contact step (backend PRD-041 FR-4, FR-17, §7):
 * the email only (required; owner, 2026-11-12), the "Email me with news
 * and offers" box (unticked, PRD-014 UX-29; it is the guest's email
 * consent, sent as the kit's `contact.acceptsMarketing`) and "Already have
 * an account? Sign in" (the code sign-in, back to this checkout with the
 * bag merged). The guest's name and phone are the delivery address's.
 */

import React from "react";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { EmailSubscribedStatus } from "@/utils/Constant";

const GuestContactDetail = ({
  register,
  setValue,
  control,
  errors,
  signInPath,
}) => {
  const subscribed = useWatch({ control, name: "emailSubscribedStatus" });
  const contactErrors = errors?.contact;

  return (
    <div className="checkout_user_details guest_contact">
      <div className="checkout_user_detailsHeader">
        <p className="checkout_subHeading text-lg uppercase">Contact</p>
        <p className="text-base guest_signin_hint">
          Already have an account?{" "}
          <Link scroll={false} href={signInPath} className="underline uppercase">
            Sign in
          </Link>
        </p>
      </div>
      <Input
        type="email"
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        aria-invalid={Boolean(contactErrors?.email)}
        error={contactErrors?.email}
        {...register("contact.email")}
      />
      <Checkbox
        label="Email me with news and offers"
        checked={subscribed === EmailSubscribedStatus.SUBSCRIBED}
        onChange={(event) =>
          setValue(
            "emailSubscribedStatus",
            event.target.checked
              ? EmailSubscribedStatus.SUBSCRIBED
              : EmailSubscribedStatus.UNSUBSCRIBED,
            { shouldDirty: true },
          )
        }
      />
    </div>
  );
};

export default GuestContactDetail;
