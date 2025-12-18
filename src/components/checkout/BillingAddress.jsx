import React, { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { PhoneInput } from "react-international-phone";
import { countriesData, addressType } from "@/helpers/Data";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import "react-international-phone/style.css";
import { RiArrowDownSLine } from "@remixicon/react";

const BillingAddress = ({ errors, control, register, setValue }) => {
  const useShippingAsBilling = useWatch({
    control,
    name: "useShippingAsBilling",
  });
  const shippingAddress = useWatch({ control, name: "shippingAddress" });
  const billingAddress = useWatch({ control, name: "billingAddress" });

  useEffect(() => {
    if (useShippingAsBilling) {
      const { phone, countryCode, addressType, ...rest } =
        shippingAddress || {};
      setValue("billingAddress", {
        ...rest,
        phone: phone || "",
        countryCode: countryCode || "",
        addressType: addressType || "",
      });
    }
  }, [useShippingAsBilling, shippingAddress, setValue]);

  return (
    <>
      <div className="checkout_user_details">

        <p className="checkout_subHeading text-lg uppercase">Billing Address</p>

        {/* Same as shipping */}
        <Checkbox
          className="cards_inner_content"
          {...register("useShippingAsBilling")}
          label="Use shipping address as billing address"
        />

        {/* Form */}
        <div className="checkout_address_form">

          {/* First/Last */}
          <div className="checkout_inp_flex">
            <Input
              disabled={useShippingAsBilling}
              placeholder="First Name"
              error={errors?.billingAddress?.firstname}
              {...register("billingAddress.firstname")}
            />
            <Input
              disabled={useShippingAsBilling}
              placeholder="Last Name"
              error={errors?.billingAddress?.lastname}
              {...register("billingAddress.lastname")}
            />
          </div>

          {/* Phone + Address Type */}
          <div className="checkout_inp_flex">
            <div className="checkOut_input">
              <PhoneInput
                disabled={useShippingAsBilling}
                value={`+${billingAddress?.countryCode?.replace("+", "") ||
                  "91"
                  }${billingAddress?.phone || ""}`}
                defaultCountry="in"
                className="delivery__phone_btn"
                inputClassName="delivery__input__phone"
                onChange={(value, metadata) => {
                  const countryCode = `+${metadata?.country?.dialCode || "91"
                    }`;
                  const numberOnly = value
                    .replace(countryCode, "")
                    .trim();

                  setValue(
                    "billingAddress.countryCode",
                    countryCode,
                    {
                      shouldValidate: true,
                    }
                  );
                  setValue("billingAddress.phone", numberOnly, {
                    shouldValidate: true,
                  });
                }}
              />
              <Input
                type="hidden"
                {...register("billingAddress.countryCode")}
              />
              <Input
                type="hidden"
                error={errors?.billingAddress?.phone}
                {...register("billingAddress.phone")}
              />
            </div>

            <div className="relative checkOut_input_pren">
              <RiArrowDownSLine size={12} className="select_arrow" />

              <select
                required
                className="checkOut_input"
                disabled={useShippingAsBilling}
                {...register("billingAddress.addressType")}
              >
                <option value="" disabled hidden  className="placeholderOption">Address Type</option>
                {addressType?.map((item, index) => (
                  <option value={item?.value || ""} key={`addr-${index}`}>{item?.label || ""}</option>
                ))}
              </select>
            </div>
            {errors?.billingAddress?.addressType && (
              <span className="error">
                {errors?.billingAddress?.addressType?.message ||
                  ""}
              </span>
            )}
          </div>


          {/* City + ZIP */}
          <div className="checkout_inp_flex">
            <Input
              disabled={useShippingAsBilling}
              placeholder="City"
              error={errors?.billingAddress?.city}
              {...register("billingAddress.city")}
            />
            <Input
              disabled={useShippingAsBilling}
              placeholder="ZIP Code"
              error={errors?.billingAddress?.pincode}
              {...register("billingAddress.pincode")}
            />
          </div>

          {/* Country + State */}
          <div className="checkout_inp_flex">

            <div className="relative checkOut_input_pren">
              <RiArrowDownSLine size={12} className="select_arrow" />
              <select
                required
                className="checkOut_input"
                disabled={useShippingAsBilling}
                {...register("billingAddress.country")}
              >
                <option value="" disabled hidden className="placeholderOption">
                  Country/Region
                </option>
                {countriesData?.map((item, index) => (
                  <option
                    value={item?.name || ""}
                    key={`country-${index}`}
                  >
                    {item?.name || ""}
                  </option>
                ))}
              </select>
            </div>
            {errors?.billingAddress?.country && (
              <span className="error">
                {errors?.billingAddress?.country?.message || ""}
              </span>
            )}
            <Input
              disabled={useShippingAsBilling}
              placeholder="State"
              error={errors?.billingAddress?.states}
              {...register("billingAddress.states")}
            />
          </div>

          {/* Address Lines */}
          <Input
            disabled={useShippingAsBilling}
            placeholder="Address Line"
            error={errors?.billingAddress?.addressline1}
            {...register("billingAddress.addressline1")}
          />
          <Input
            disabled={useShippingAsBilling}
            placeholder="Apartment, Suite, etc"
            {...register("billingAddress.addressline2")}
          />
        </div>
      </div>
    </>
  )
}

export default BillingAddress

