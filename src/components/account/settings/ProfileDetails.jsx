"use client";
import React, { useEffect, useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { UPDATE_USER_PROFILE } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/errors';
import { RiCheckLine } from '@remixicon/react'
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/common/PhoneInput';
import { PHONE_INVALID_MESSAGE, isValidPhone } from '@/utils/phone';
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'

const ProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  countryCode: z.string().min(1, "Country Code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email"),
}).superRefine((values, ctx) => {
  if (!values.phoneNumber || isValidPhone(values.countryCode, values.phoneNumber)) {
    return;
  }
  ctx.addIssue({
    code: "custom",
    path: ["phoneNumber"],
    message: PHONE_INVALID_MESSAGE,
  });
});

const ProfileDetails = () => {
  const [isEditable, setIsEditable] = useState(false);
  const [updateUser, { loading }] = useMutation(UPDATE_USER_PROFILE);
  const { user, setUser } = useAuthStore((state) => state);
  useLayoutEffect(() => {
    if (isEditable) {
      gsap.to(".details_form_paren", { height: "auto", duration: 0.5, ease: "power2.out" })
    } else {
      gsap.to(".details_form_paren", { height: "0vh",duration: 0.5, ease: "power2.out" })
    }
  }, [isEditable])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      countryCode: user?.countryCode || "+91",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  // The profile loads after mount on a reload (it isn't persisted, RSEC-11).
  useEffect(() => {
    if (!user || isEditable) return;
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      countryCode: user.countryCode || "+91",
      phoneNumber: user.phoneNumber || "",
    });
  }, [user, isEditable, reset]);

  const onSubmit = async (data) => {
    if (!isEditable) return;
    try {
      // The login email is the account identity and is not edited here.
      const { email, ...input } = data;
      const { data: response } = await updateUser({
        variables: { input },
      });
      const updatedUser = response?.updateMyProfile;

      if (updatedUser) {
        setUser(updatedUser);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Update failed"));
    }
  };

  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__block ">
        <div>
          <p>{`${user?.firstName} ${user?.lastName}`}</p>
          <p>{`${user?.countryCode} ${user?.phoneNumber}`}</p>
          <p>{user?.email}</p>
        </div>
        {!isEditable && (
          <div onClick={() => setIsEditable(true)} className="settings__link">
            <p>Edit My details</p>
          </div>
        )}
        <div className="details_form_paren">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className=" settings_inp_flex">
              <div className="inp_paren">
                <Input label="First Name" isRequired={true} error={errors.firstName} {...register("firstName")} />
                {/* <RiCheckLine className='check_icon' /> */}
              </div>
              <div className="inp_paren">
                <Input label="Last Name" isRequired={true} error={errors.lastName} {...register("lastName")} />
                {/* <RiCheckLine className='check_icon' /> */}
              </div>
            </div>
            <div className=" settings_inp_flex">

              <div className="inp_paren">
                <Input label="Email" isRequired={true} readOnly error={errors.email} {...register("email")} />
                {/* <RiCheckLine className='check_icon' /> */}
              </div>
              <div className="inp_paren text-base">
                <p className='text-sm '>Contact <span>*</span> </p>
                <div>
                  <PhoneInput
                    label="Phone number"
                    placeholder="Enter phone number"
                    className="settings_input"
                    countryCode={watch("countryCode")}
                    phone={watch("phoneNumber")}
                    onChange={({ countryCode, phone }) => {
                      setValue("countryCode", countryCode, {
                        shouldValidate: true,
                      });
                      setValue("phoneNumber", phone, {
                        shouldValidate: true,
                      });
                    }}
                    error={errors.phoneNumber?.message || ""}
                    errorClassName="input_error_msg"
                  />
                  <Input type="hidden" error={errors.countryCode} {...register("countryCode")} />
                  <Input type="hidden" {...register("phoneNumber")} />
                </div>
                {/* <RiCheckLine className='check_icon' /> */}
              </div>
            </div>
            <div className="settings_btn">
              <GreenBoxBtn title={loading ? "Saving" : "Save"} loading={loading} />
              <button type='button' onClick={() => setIsEditable(false)} className='cancel_form_btn'>
                <p>
                  Cancel
                </p>
              </button>
            </div>
          </form>
        </div>
      </div>

    </>
  )
}

export default ProfileDetails