import React, { useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { UPDATE_USER_PASSWORD } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "react-toastify";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import Input from "@/components/ui/Input";
import { AuthCookies } from "@/utils/AuthCookies";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Must include at least one lowercase letter")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number")
      .regex(/[^a-zA-Z0-9]/, "Must include at least one special character"),
    renewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.renewPassword, {
    path: ["renewPassword"],
    message: "Passwords do not match",
  });
const ChangePassword = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    renewPassword: false,
  });
  const [updatePassword, { loading }] = useMutation(UPDATE_USER_PASSWORD);
  const { user } = useAuthStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useLayoutEffect(() => {
    if (isEdit) {
      gsap.to(".password_form_paren", { height: "auto",duration: 0.5, ease: "power2.out" })
    } else {
      gsap.to(".password_form_paren", { height: "0vh",  duration: 0.5, ease: "power2.out" })
    }
  }, [isEdit])

  const onVisibleChange = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async (data) => {
    try {
      const input = {
        email: user?.email || null,
        currentPassword: data?.currentPassword || null,
        newPassword: data?.renewPassword || null,
      };
      const { data: response } = await updatePassword({
        variables: { ...input },
      });
      const { userToken } = response?.changeUserPassword || {};
      if (userToken) {
        AuthCookies.set(userToken);
        reset();
        toast.success("Password Updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Update failed");
      reset();
    }
  };

  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__block ">
        {isEdit && (
          <p>Change Your Password </p>
        )}
        {!isEdit && (
          <div onClick={() => setIsEdit(true)} className="settings__link">
            <p>Change Password</p>
          </div>
        )}
        <div className="password_form_paren">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="inp_paren text-base">
              <Input type={visible?.currentPassword ? "text" : "password"} label="Enter Current Password" isRequired={true} error={errors.currentPassword} {...register("currentPassword")} />
              {visible?.currentPassword ? (
                <RiEyeLine size={18} className="check_icon" onClick={() => onVisibleChange("currentPassword")} />
              ) : (
                <RiEyeOffLine size={18} className="check_icon" onClick={() => onVisibleChange("currentPassword")} />
              )}
            </div>
            <div className="settings_inp_flex">
              <div className="inp_paren text-base">
                <Input type={visible?.newPassword ? "text" : "password"} label="Enter New Password" isRequired={true} error={errors.newPassword} {...register("newPassword")} />
                {visible?.newPassword ? (
                  <RiEyeLine size={18} className="check_icon" onClick={() => onVisibleChange("newPassword")} />
                ) : (
                  <RiEyeOffLine size={18} className="check_icon" onClick={() => onVisibleChange("newPassword")} />
                )}
              </div>
              <div className="inp_paren text-base">
                <Input type={visible?.renewPassword ? "text" : "password"} label="Confirm New Password" isRequired={true} error={errors.renewPassword} {...register("renewPassword")} />
                {visible?.renewPassword ? (
                  <RiEyeLine size={18} className="check_icon" onClick={() => onVisibleChange("renewPassword")} />
                ) : (
                  <RiEyeOffLine size={18} className="check_icon" onClick={() => onVisibleChange("renewPassword")} />
                )}
              </div>
            </div>
            <div className="settings_btn">

              <GreenBoxBtn title="Save" loading={loading} />
              <button type='button' onClick={() => setIsEdit(false)} className='cancel_form_btn'>
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

export default ChangePassword