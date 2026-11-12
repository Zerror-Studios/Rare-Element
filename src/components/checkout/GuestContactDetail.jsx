"use client";

/**
 * The guest checkout's Contact step (backend PRD-041 FR-4, FR-17, §7):
 * email and phone (required; the backend's order messages go to them),
 * first and last name, the "Email me with news and offers" box (unticked,
 * PRD-014 UX-29; it is the guest's email consent) and "Already have an
 * account? Sign in" (the code sign-in, back to this checkout with the bag
 * merged). Names and phone fill the empty delivery fields on blur
 * (`onPrefill`).
 */

import React from "react";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import { EmailSubscribedStatus } from "@/utils/Constant";

const GuestContactDetail = ({
  register,
  setValue,
  control,
  errors,
  signInPath,
  onPrefill,
}) => {
  const contact = useWatch({ control, name: "contact" });
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
      <div className="checkOut_input">
        <PhoneInput
          defaultCountry="in"
          className="delivery__phone_btn"
          inputClassName="delivery__input__phone"
          inputProps={{ "aria-label": "Phone", autoComplete: "tel" }}
          value={`+${contact?.countryCode?.replace("+", "") || "91"}${contact?.phone || ""}`}
          onChange={(value, metadata) => {
            const countryCode = `+${metadata?.country?.dialCode || "91"}`;
            const numberOnly = value.replace(countryCode, "").trim();
            setValue("contact.countryCode", countryCode);
            setValue("contact.phone", numberOnly, {
              shouldValidate: Boolean(contactErrors?.phone),
            });
          }}
          onBlur={onPrefill}
        />
        <Input type="hidden" {...register("contact.countryCode")} />
        <Input
          type="hidden"
          error={contactErrors?.phone}
          {...register("contact.phone")}
        />
      </div>
      <div className="checkout_inp_flex">
        <Input
          placeholder="First Name"
          aria-label="First name"
          autoComplete="given-name"
          error={contactErrors?.firstName}
          {...register("contact.firstName", { onBlur: onPrefill })}
        />
        <Input
          placeholder="Last Name"
          aria-label="Last name"
          autoComplete="family-name"
          error={contactErrors?.lastName}
          {...register("contact.lastName", { onBlur: onPrefill })}
        />
      </div>
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
