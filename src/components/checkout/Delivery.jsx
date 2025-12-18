import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap';
import { useWatch } from "react-hook-form";
import { useAuthStore } from "@/store/auth-store";
import { Sort } from "@/utils/Constant";
import { useQuery } from "@apollo/client/react";
import { USER_ADDRESS_LIST } from "@/graphql";
import { RiArrowDownSLine, RiCheckLine } from '@remixicon/react'
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { countriesData, addressType } from "@/helpers/Data";
import Input from '@/components/ui/Input';
import Checkbox from '../ui/Checkbox';

const Delivery = ({ errors, control, register, setValue }) => {
  const LIMIT = 10;
  const addressRef = useRef(null)
  const [isAddress, setIsAddress] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [offset, setOffset] = useState(0);
  const shippingAddress = useWatch({ control, name: "shippingAddress" });
  const { isLoggedIn, user } = useAuthStore((state) => state);
  const payload = {
    filters: { userId: user?._id },
    limit: LIMIT,
    offset,
    sort: { createdAt: Sort.DESC, primary: Sort.ASC },
  };

  useEffect(() => {
    if (addressRef.current) {
      gsap.set(addressRef.current, { height: 0 })
    }
    if (isAddress) {
      gsap.to(addressRef.current, { height: "auto", duration: 0.5, ease: "ease-in-out" })
    } else {
      gsap.to(addressRef.current, { height: 0, duration: 0.5, ease: "ease-in-out" })
    }
  }, [isAddress])

  const {
    data: addressResponse,
    loading,
  } = useQuery(USER_ADDRESS_LIST, {
    skip: !isLoggedIn,
    variables: payload,
  });
  const { data = [] } = addressResponse?.getAddressByFilters || {};

  useEffect(() => {
    if (data.length > 0) {
      setIsAddress(false);
    }
  }, [data]);

  const handleAddress = (e) => {
    const parsedValue = parseInt(e.target.value, 10);
    setSelectedAddress(parsedValue);
    const selected = data[parsedValue];
    if (!selected) return;
    setValue("shippingAddress", selected, { shouldValidate: true });
    setValue("billingAddress", selected, { shouldValidate: true });
  };


  return (
    <>
      <div className="checkout_user_details">
        <div className="checkout_user_detailsHeader">
          <p className="checkout_subHeading text-lg uppercase">Shipping Address</p>
          {
            !isAddress && (
              <div onClick={() => setIsAddress(true)} className="settings__link">
                <p className="underline uppercase text-base"> + Add New Address</p>
              </div>
            )
          }
          {
            data.length > 0 && (
              isLoggedIn && isAddress && (
                <div onClick={() => setIsAddress(false)} className="settings__link">
                  <p className="underline uppercase text-base"> Use saved address</p>
                </div>
              )
            )
          }
        </div>
        {isAddress && (
          <div ref={addressRef} className="checkout_address_form shipping_addres_paren">

            {/* First + Last Name */}
            <div className="checkout_inp_flex">
              <Input
                placeholder="First Name"
                error={errors?.shippingAddress?.firstname}
                {...register("shippingAddress.firstname")}
              />
              <Input
                placeholder="Last Name"
                error={errors?.shippingAddress?.lastname}
                {...register("shippingAddress.lastname")}
              />
            </div>

            {/* Phone + Address Type */}
            <div className="checkout_inp_flex">
              <div className="checkOut_input">
                <PhoneInput
                  defaultCountry="in"
                  className="delivery__phone_btn"
                  inputClassName="delivery__input__phone"
                  value={`+${shippingAddress?.countryCode?.replace("+", "") || "91"
                    }${shippingAddress?.phone || ""}`}
                  onChange={(value, metadata) => {
                    const countryCode = `+${metadata?.country?.dialCode || "91"}`;
                    const numberOnly = value.replace(countryCode, "").trim();

                    setValue("shippingAddress.countryCode", countryCode, {
                      shouldValidate: true,
                    });
                    setValue("shippingAddress.phone", numberOnly, {
                      shouldValidate: true,
                    });
                  }}
                />
                <Input
                  type="hidden"
                  {...register("shippingAddress.countryCode")}
                />
                <Input
                  type="hidden"
                  error={errors?.shippingAddress?.phone}
                  {...register("shippingAddress.phone")}
                />
              </div>
              <div className="relative checkOut_input_pren">
                <RiArrowDownSLine size={12} className="select_arrow" />
                <select required className="checkOut_input" {...register("shippingAddress.addressType")}>
                  <option value="" disabled hidden className="placeholderOption">Address Type</option>
                  {addressType?.map((item, index) => (
                    <option value={item?.value || ""} key={`addr-${index}`}>
                      {item?.label || ""}
                    </option>
                  ))}
                </select>
              </div>
              {errors?.shippingAddress?.addressType && (
                <span className="error">
                  {errors?.shippingAddress?.addressType?.message ||
                    ""}
                </span>
              )}
            </div>
            {/* City + ZIP */}
            <div className="checkout_inp_flex">
              <Input
                placeholder="City"
                error={errors?.shippingAddress?.city}
                {...register("shippingAddress.city")}
              />
              <Input
                placeholder="ZIP Code"
                error={errors?.shippingAddress?.pincode}
                {...register("shippingAddress.pincode")}
              />
            </div>

            {/* Country + State */}
            <div className="checkout_inp_flex">
              <div className="relative checkOut_input_pren">
                <RiArrowDownSLine size={12} className="select_arrow" />
                <select className="checkOut_input" required {...register("shippingAddress.country")}>
                  <option value="" disabled hidden className="placeholderOption">
                    Country/Region
                  </option>
                  {countriesData?.map((item, index) => (
                    <option value={item?.name || ""} key={`country-${index}`}>
                      {item?.name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                placeholder="State"
                error={errors?.shippingAddress?.states}
                {...register("shippingAddress.states")}
              />
            </div>

            {/* Address lines */}
            <Input
              placeholder="Address Line"
              error={errors?.shippingAddress?.addressline1}
              {...register("shippingAddress.addressline1")}
            />
            <Input
              placeholder="Apartment, Suite, etc"
              {...register("shippingAddress.addressline2")}
            />
          </div>
        )}

        {/* Saved Address */}
        {!isAddress && data.length > 0 && (
          <div className="address_div">
            {data?.map((item, index) => (
              <div key={`address-${index}`} className="address_box text-base">
                <div className="select_address_paren">
                  <Checkbox onChange={handleAddress} value={index} checked={selectedAddress === index} />
                </div>
                <p>{item?.firstname || ""} {item?.lastname || ""}</p>
                <p>{item?.flat || ""} {item?.addressline1 || ""}</p>
                <p>{item?.addressline2 || ""}</p>
                <p>{item?.city || ""}, {item?.country || ""}</p>
                <p>{item?.pincode || ""}</p>
                <p>{item?.addressType || ""} | {item?.phone || ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Delivery
