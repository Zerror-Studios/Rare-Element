"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
import { useMutation } from "@apollo/client/react";
import { CUSTOMER_LOGIN } from "@/graphql";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/errors";
import { getNextPath } from "@/utils/redirect";
import Link from "next/link";

// Schema validation
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


const Login = ({ setToggle }) => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { completeLogin } = useAuth();
  const [customerLogin, { loading }] = useMutation(CUSTOMER_LOGIN);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (formData) => {
    try {
      const { data } = await customerLogin({ variables: { input: formData } });
      const { accessToken, expiresIn } = data?.customerLogin || {};

      if (!accessToken) {
        toast.error("Invalid email or password.");
        return;
      }

      const user = await completeLogin(accessToken, expiresIn);
      if (!user) {
        toast.error("Profile not found after login.");
        return;
      }
      toast.success("Login successful!");
      router.replace(getNextPath());
    } catch (err) {
      // Login errors are uniform server-side (no account enumeration).
      toast.error(
        getErrorMessage(err, "Login failed. Please try again.", {
          UNAUTHENTICATED: "Invalid email or password.",
          BAD_REQUEST: "Invalid email or password.",
        }),
      );
    }
  };

  return (
    <div className="left-two">
      <div className="login-inner">
        <div className="login-t text-3xl">
          <p>
            LOGIN
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
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
              className="login-inp text-lg"
              type={visible ? "text" : "password"}
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
          <div className="forgot-link">
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
          <div className="signup_btn">
            <GreenBoxBtn title={"Login"} loading={loading} />
          </div>
        </form>

        <div className="not-up">
          <p>
            Not a member yet?{" "}
            <span onClick={() => setToggle(true)}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
