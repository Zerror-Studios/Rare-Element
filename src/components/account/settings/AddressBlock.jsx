"use client";
import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  CREATE_ADDRESS,
  DELETE_ADDRESS,
  GET_ADDRESSES,
  UPDATE_ADDRESS,
} from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { addressType, countriesData } from "@/helpers/Data";
import { getErrorMessage } from "@/utils/errors";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import Input from "@/components/ui/Input";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

const addressSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  addressType: z.string().min(1, "Address type is required"),
  addressline1: z.string().min(1, "Address line 1 is required"),
  addressline2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(4, "Pincode is required"),
  country: z.string().min(1, "Country is required"),
  states: z.string().min(1, "State is required"),
  phone: z.string().min(8, "Phone number required"),
  countryCode: z.string().min(1, "Country code required"),
});

const AddressBlock = () => {
  const [isOpen, setIsOpen] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const { user } = useAuthStore();
  const formRef = useRef(null);

  const { data: addressResponse, loading, refetch } = useQuery(GET_ADDRESSES);

  // Primary address first; the API returns the customer's own addresses.
  const addressList = [...(addressResponse?.getAddresses || [])].sort(
    (a, b) => Number(!!b?.primary) - Number(!!a?.primary)
  );

  const [createAddress, { loading: createLoading }] = useMutation(CREATE_ADDRESS);
  const [updateAddress, { loading: updateLoading }] = useMutation(UPDATE_ADDRESS);
  const [deleteAddress] = useMutation(DELETE_ADDRESS);
  const addressLoading = createLoading || updateLoading;

  useLayoutEffect(() => {
    if (!formRef.current) return;

    gsap.to(formRef.current, {
      height: isOpen !== null ? "auto" : 0,
      duration: 0.5,
      ease: "power2.out",
    });
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      addressType: "HOME",
      addressline1: "",
      addressline2: "",
      city: "",
      pincode: "",
      country: "India",
      states: "",
      phone: "",
      countryCode: "+91",
    },
  });

  useEffect(() => {
    if (isOpen !== null) {
      const editData = addressList[isOpen] || {};
      setAddressId(editData?._id);
      reset({
        firstname: editData.firstname || user?.firstName,
        lastname: editData.lastname || user?.lastName,
        addressType: editData.addressType || "HOME",
        addressline1: editData.addressline1,
        addressline2: editData.addressline2,
        city: editData.city,
        pincode: editData.pincode,
        country: editData.country || "India",
        states: editData.states,
        phone: editData.phone,
        countryCode: editData.countryCode || "+91",
      });
    }
  }, [isOpen]);

  const onSubmit = async (formData) => {
    try {
      const input = { ...formData };

      if (addressId) {
        await updateAddress({ variables: { addressId, input } });
      } else {
        await createAddress({
          variables: { input: { ...input, primary: addressList.length === 0 } },
        });
      }

      toast.success("Address saved successfully!");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save"));
    } finally {
      reset();
      setIsOpen(null);
      setAddressId(null);
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteAddress({ variables: { addressId: id } });
      toast.success("Address removed");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove address"));
    }
  };

  return (
    <>
      <div className="checkout_thin_line"></div>

      <div className="settings__block">
        {addressList.length === 0 && <p>No Address Added</p>}
        {addressList.map((item, index) => (
          <div key={item._id} className="address_list">
            <p>{item.firstname} {item.lastname}</p>
            <p>{item.addressline1}</p>
            {item.addressline2 && <p>{item.addressline2}</p>}
            <p>{`${item.city}, ${item.states}, ${item.country} - ${item.pincode}`}</p>
            <p>{`${item.countryCode} ${item.phone} - ${item?.addressType}`}</p>
            <div className="edit_address_btn">
              {isOpen !== index && (
                <div
                  onClick={() => setIsOpen(index)}
                  className="settings__link"
                >
                  <p>Edit Address</p>
                </div>
              )}
              {isOpen !== index && (
                <div
                  onClick={() => onDelete(item._id)}
                  className="settings__link"
                >
                  <p>Remove</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isOpen === null && (
          <div onClick={() => setIsOpen(addressList.length)} className="settings__link">
            <p>Add Address</p>
          </div>
        )}

        {/* Form */}
        <div ref={formRef} className="address_form_paren overflow-hidden h-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="settings_inp_flex">

              {/* FIRST NAME */}
              <div className="inp_paren">
                <Input
                  label="First Name"
                  isRequired
                  error={errors.firstname}
                  {...register("firstname")}
                />
              </div>

              {/* LAST NAME */}
              <div className="inp_paren">
                <Input
                  label="Last Name"
                  isRequired
                  error={errors.lastname}
                  {...register("lastname")}
                />
              </div>
            </div>

            <div className="settings_inp_flex">
              {/* COUNTRY */}
              <div className="inp_paren">
                <p className="text-sm some_margin">Country <span>*</span></p>
                <select className="checkOut_input" {...register("country")}>
                  {countriesData.map((c, i) => (
                    <option key={i} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="input_error_msg">{errors.country.message}</p>
                )}
              </div>

              {/* PHONE */}
              <div className="inp_paren">
                <p className="text-sm">Contact <span>*</span></p>
                <div className="settings_input">
                  <PhoneInput
                    defaultCountry="in"
                    className="delivery__phone_btn"
                    inputClassName="delivery__input__phone"
                    enableSearch={true}   // allows searching countries
                    inputStyle={{ width: "100%" }} // full width like other inputs
                    buttonStyle={{ border: "none" }} // clean flag dropdown
                    placeholder="Enter phone number"
                    onChange={(value, meta) => {
                      const countryCode = `+${meta.country.dialCode}`;
                      const number = value.replace(countryCode, "").trim();

                      setValue("countryCode", countryCode, { shouldValidate: true });
                      setValue("phone", number, { shouldValidate: true });
                    }}
                  />

                  <Input type="hidden" {...register("countryCode")} />
                  <Input type="hidden" error={errors.phone} {...register("phone")} />
                </div>
              </div>
            </div>

            <div className="settings_inp_flex">

              {/* PINCODE */}
              <div className="inp_paren">
                <Input
                  label="Area Pincode"
                  type="number"
                  isRequired
                  error={errors.pincode}
                  {...register("pincode")}
                />
              </div>

              {/* ADDRESS TYPE */}
              <div className="inp_paren">
                <p className="text-sm some_margin">Address Type <span>*</span></p>
                <select className="checkOut_input" {...register("addressType")}>
                  {addressType.map((t, index) => (
                    <option key={index} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.addressType && (
                  <p className="input_error_msg">{errors.addressType.message}</p>
                )}
              </div>
            </div>

            <div className="settings_inp_flex">

              {/* CITY */}
              <div className="inp_paren">
                <Input
                  label="City"
                  isRequired
                  error={errors.city}
                  {...register("city")}
                />
              </div>

              {/* STATE */}
              <div className="inp_paren">
                <Input
                  label="State"
                  isRequired
                  error={errors.states}
                  {...register("states")}
                />
              </div>
            </div>

            {/* ADDRESS LINE 1 */}
            <div className="inp_paren">
              <Input
                label="Address Line 1"
                isRequired
                error={errors.addressline1}
                {...register("addressline1")}
              />
            </div>

            {/* ADDRESS LINE 2 */}
            <div className="inp_paren">
              <Input
                label="Address Line 2 (Optional)"
                error={errors.addressline2}
                {...register("addressline2")}
              />
            </div>




            <div className="settings_btn">

              <GreenBoxBtn title="Save" loading={addressLoading} />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(null);
                  reset();
                }}
                className="cancel_form_btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddressBlock;
