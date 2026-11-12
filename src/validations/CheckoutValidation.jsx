import { z } from "zod";
import { addressType } from "@/helpers/Data";
import {
  EmailSubscribedStatus,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_MESSAGE,
} from "@/utils/Constant";
import { PHONE_INVALID_MESSAGE, isValidPhone } from "@/utils/phone";

const addressEnum = addressType.map((item) => item.value);

export const AddressSchema = z.object({
  firstname: z.string().trim().min(1, "First name is required"),
  lastname: z.string().trim().min(1, "Last name is required"),
  addressType: z.enum(addressEnum, {
    required_error: "Address type is required",
  }),
  addressline1: z.string().trim().min(1, "Address Line 1 is required"),
  addressline2: z.string().trim().optional(),
  country: z.string().trim().min(1, "Country is required"),
  states: z.string().trim().min(1, "State is required"),
  city: z.string().trim().min(1, "city is required"),
  pincode: z.string().trim().min(1, "Pincode is required"),
  countryCode: z.string().trim().min(1, "Country Code is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  primary: z.boolean(),
}).superRefine((address, ctx) => {
  // A real number for its country; for India a mobile (Shiprocket)
  if (!address?.phone || isValidPhone(address.countryCode, address.phone)) {
    return;
  }
  ctx.addIssue({
    code: "custom",
    path: ["phone"],
    message: PHONE_INVALID_MESSAGE,
  });
});

export const CheckoutSchema = z
  .object({
    email: z.string().trim().min(1, "Email is required").email("Invalid email"),
    emailSubscribedStatus: z.enum(Object.values(EmailSubscribedStatus), {
      required_error: "Email subscribed is required"
    }).default(EmailSubscribedStatus.SUBSCRIBED),
    password: z
      .string()
      .trim()
      .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_MESSAGE)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .optional(),

    useShippingAsBilling: z.boolean().default(true),
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.useShippingAsBilling && !data.billingAddress) {
      ctx.addIssue({
        path: ["billingAddress"],
        code: z.ZodIssueCode.custom,
        message: "Billing address is required when not using shipping address",
      });
    }
  });

// ─── Guest checkout (backend PRD-041 FR-4, FR-17) ─────────────────────────

/**
 * The Contact step is the email only (owner, 2026-11-12): the guest's name
 * and phone come from the delivery address (`toGuestContact`), whose phone
 * `AddressSchema` checks.
 */
export const GuestContactSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
});

/** The guest checkout form; the billing address only when it is separate. */
export const GuestCheckoutSchema = z
  .object({
    contact: GuestContactSchema,
    emailSubscribedStatus: z
      .enum(Object.values(EmailSubscribedStatus))
      .default(EmailSubscribedStatus.UNSUBSCRIBED),
    useShippingAsBilling: z.boolean().default(true),
    shippingAddress: AddressSchema,
    billingAddress: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.useShippingAsBilling) return;
    const result = AddressSchema.safeParse(data.billingAddress);
    if (result.success) return;
    for (const issue of result.error.issues) {
      ctx.addIssue({
        ...issue,
        path: ["billingAddress", ...(issue.path ?? [])],
      });
    }
  });
