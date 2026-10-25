"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_MESSAGE,
} from "@/utils/Constant";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
import { PhoneInput } from "react-international-phone";
import { useMutation } from "@apollo/client/react";
import { SIGN_UP_USER, CUSTOMER_LOGIN } from "@/graphql";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/errors";
import { getNextPath } from "@/utils/redirect";
import "react-international-phone/style.css";

const SignupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    countryCode: z.string().min(1, "Country Code is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_MESSAGE)
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Signup = ({ setToggle }) => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signupUser, { loading }] = useMutation(SIGN_UP_USER);
  const [customerLogin] = useMutation(CUSTOMER_LOGIN);
  const { completeLogin } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SignupSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    let createdUser = null;
    try {
      // The account status is decided server-side, never sent.
      const { confirmPassword, ...input } = data;

      const { data: signupResponse } = await signupUser({ variables: { input } });
      createdUser = signupResponse?.customerSignup;
      if (!createdUser?._id) return;

      // Automatically login the user after successful signup
      const { data: loginResponse } = await customerLogin({
        variables: {
          input: {
            email: input.email,
            password: input.password
          }
        }
      });

      const { accessToken, expiresIn } = loginResponse?.customerLogin || {};
      if (!accessToken) throw new Error("Login after signup failed");

      await completeLogin(accessToken, expiresIn);
      toast.success("Account created successfully!");
      router.replace(getNextPath());
    } catch (err) {
      if (createdUser?._id) {
        toast.error("Account created, but login failed. Please login manually.");
        setToggle(false); // Switch to login tab
        return;
      }
      toast.error(
        getErrorMessage(err, "Signup failed. Please try again.", {
          CONFLICT: "This email is already registered. Please log in.",
        }),
      );
    }
  };

  return (
    <div className="left-two">
      <div className="login-inner">
        <div className="login-t text-3xl">
          <p>
            SIGN UP
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="name-cont">
            <div className="half-inp-cont inp-rel">
              <input
                className="login-inp text-lg"
                placeholder="First Name"
                required
                {...register("firstName")}
              />
              {errors?.firstName && (
                <div className="error-p">
                  <p>
                    {errors?.firstName?.message || ""}
                  </p>
                </div>
              )}
            </div>
            <div className="half-inp-cont inp-rel">
              <input
                className="login-inp text-lg"
                placeholder="Last Name"
                required
                {...register("lastName")}
              />
              {errors?.lastName && (
                <div className="error-p">
                  <p>
                    {errors?.lastName?.message || ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className=" inp-rel login-inp">
            <PhoneInput
              defaultCountry="in"
              inputClassName=""
              className="  tele_inp  "
              onChange={(value, metadata) => {
                const countryCode = `+${metadata?.country?.dialCode || 91}`;
                const numberOnly = value?.replace(countryCode, "").trim();

                setValue("countryCode", countryCode);
                setValue("phoneNumber", numberOnly);
              }}
            />
            <input type="hidden" {...register("countryCode")} />
            <input type="hidden" {...register("phoneNumber")} />
            {errors?.phoneNumber && (
              <div className="error-p phone-error">
                <p>
                  {errors?.phoneNumber?.message || ""}
                </p>
              </div>
            )}
          </div>

          <div className="inp-rel">
            <input
              className="login-inp text-lg"
              placeholder="Email"
              type="email"
              required
              {...register("email")}
            />
            {errors?.email && (
              <div className="error-p">
                <p>
                  {errors?.email?.message || ""}
                </p>
              </div>
            )}
          </div>

          <div className="pass-cont inp-rel">
            <div
              className="eye-cont flex-all"
              onClick={() => setVisible(!visible)}
            >
              {visible ? <RiEyeLine size={20} /> : <RiEyeOffLine size={20} />}
            </div>
            <input
              type={visible ? "text" : "password"}
              className="login-inp text-lg"
              placeholder="Password"
              required
              {...register("password")}
            />
            {errors?.password && (
              <div className="error-p">
                <p>
                  {errors?.password?.message || ""}
                </p>
              </div>
            )}
          </div>

          <div className="pass-cont inp-rel">
            <div
              className="eye-cont flex-all"
              onClick={() => setConfirmVisible(!confirmVisible)}
            >
              {confirmVisible ? <RiEyeLine size={20} /> : <RiEyeOffLine size={20} />}
            </div>
            <input
              type={confirmVisible ? "text" : "password"}
              className="login-inp text-lg"
              placeholder="Confirm Password"
              required
              {...register("confirmPassword")}
            />
            {errors?.confirmPassword && (
              <div className="error-p">
                <p>
                  {errors?.confirmPassword?.message}
                </p>
              </div>
            )}
          </div>

          <div className="signup_btn">
            <GreenBoxBtn title={"Signup"} loading={loading} />
          </div>

        </form>

        <div className="not-up">
          <p>
            Already a member?{" "}
            <span onClick={() => setToggle(false)}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
