import React, { useLayoutEffect, useState } from 'react'
import gsap from 'gsap'
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { UPDATE_USER_PROFILE } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { toast } from 'react-toastify';
import { RiCheckLine } from '@remixicon/react'
import { PhoneInput } from "react-international-phone";
import Input from '@/components/ui/Input';
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'
import "react-international-phone/style.css";

const ProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  countryCode: z.string().min(1, "Country Code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email"),
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

  const onSubmit = async (data) => {
    if (!isEditable) return;
    try {
      const input = {
        ...data,
      };
      const { data: response } = await updateUser({
        variables: { input, clientUserUpdateId: user?._id },
      });
      const updatedUser = response?.clientUserUpdate?.user;

      if (updatedUser) {
        setUser(updatedUser);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Update failed");
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
                <Input label="Email" isRequired={true} error={errors.email} {...register("email")} />
                {/* <RiCheckLine className='check_icon' /> */}
              </div>
              <div className="inp_paren text-base">
                <p className='text-sm '>Contact <span>*</span> </p>
                <div className="settings_input">
                  <PhoneInput
                    defaultCountry="in"
                    className="delivery__phone_btn"
                    inputClassName="delivery__input__phone"
                    enableSearch={true}   // allows searching countries
                    inputStyle={{ width: "100%" }} // full width like other inputs
                    buttonStyle={{ border: "none" }} // clean flag dropdown
                    placeholder="Enter phone number"
                    value={`+${user?.countryCode?.replace("+", "") || "91"}${user?.phoneNumber || ""
                      }`}
                    onChange={(value, metadata) => {
                      const countryCode = `+${metadata?.country?.dialCode || 91
                        }`;
                      const numberOnly = value
                        ?.replace(countryCode, "")
                        .trim();

                      setValue("countryCode", countryCode, {
                        shouldValidate: true,
                      });
                      setValue("phoneNumber", numberOnly, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  <Input type="hidden" error={errors.countryCode} {...register("countryCode")} />
                  <Input type="hidden" error={errors.phoneNumber} {...register("phoneNumber")} />
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