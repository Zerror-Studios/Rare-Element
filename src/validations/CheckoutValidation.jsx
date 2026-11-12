import { z } from "zod";
import { addressType } from "@/helpers/Data";
import {
  EmailSubscribedStatus,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_MESSAGE,
} from "@/utils/Constant";

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

// The backend accepts 7 to 15 digits (`INVALID_PHONE` otherwise).
const PHONE_DIGITS_MIN = 7;
const PHONE_DIGITS_MAX = 15;

const phoneDigits = (value) => String(value || "").replace(/\D/g, "").length;

/** The Contact step: email and phone required, names optional. */
export const GuestContactSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  countryCode: z.string().min(1, "Country code is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) =>
        phoneDigits(value) >= PHONE_DIGITS_MIN &&
        phoneDigits(value) <= PHONE_DIGITS_MAX,
      "Enter a valid phone number",
    ),
  firstName: z.string().trim().max(100, "That name is too long").optional(),
  lastName: z.string().trim().max(100, "That name is too long").optional(),
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
