import { z } from "zod";
import { addressType } from "@/helpers/Data";
import { EmailSubscribedStatus } from "@/utils/Constant";

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
      .min(6, "Password must be at least 6 characters")
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
