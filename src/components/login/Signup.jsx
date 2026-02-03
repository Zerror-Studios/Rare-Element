import React, { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
import { PhoneInput } from "react-international-phone";
import { useMutation } from "@apollo/client/react";
import { SIGN_UP_USER } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { UserStatus } from "@/utils/Constant"
import { toast } from "react-toastify";
import { AuthCookies } from "@/utils/AuthCookies";
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
      .min(6, "Password must be at least 6 characters")
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
  const { setUser, setIsLoggedIn } = useAuthStore((state) => state);

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
    try {
      const { confirmPassword, ...rest } = data;
      const input = {
        ...rest,
        status: UserStatus.ACTIVE,
      };
      const { data: response } = await signupUser({ variables: { input } });
      const { user, userToken } = response?.clientUserSave || {};
      if (userToken && Object.keys(user).length > 0) {
        localStorage.removeItem("visitorId");
        localStorage.removeItem("visitorExpire");
        AuthCookies.remove(); // clear previous
        AuthCookies.set(userToken);
        setUser(user);
        setIsLoggedIn(true);
        toast.success("Account created successfully!");
        router.back();
      }
    } catch (err) {
      // console.error(err);
      if (err.message === 'Error in Save user for client: Nahara for Error "User Already Exists!!"') {
        toast.error("User already exists with this email")
      }else{
        toast.error("Signup failed");
      }
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
