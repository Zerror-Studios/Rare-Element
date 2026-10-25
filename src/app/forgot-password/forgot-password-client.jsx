"use client";

/**
 * Forgot password form (PRD-003 FR-0.5)
 *
 * One email field. After the server answers, the page shows the uniform
 * "check your inbox" state: the backend never reveals whether the email
 * has an account, so neither does this page.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { CUSTOMER_REQUEST_PASSWORD_RESET } from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { getErrorMessage } from "@/utils/errors";

// ─── Schema ───────────────────────────────────────────────────────────────

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─── Component ────────────────────────────────────────────────────────────

const ForgotPasswordClient = () => {
  const [isSent, setIsSent] = useState(false);
  const [requestReset, { loading }] = useMutation(
    CUSTOMER_REQUEST_PASSWORD_RESET,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  /* ----- Handlers ----- */
  const onSubmit = async (formData) => {
    try {
      await requestReset({ variables: { email: formData.email.trim() } });
      setIsSent(true);
    } catch (err) {
      toast.error(
        getErrorMessage(err, "We couldn't send the link. Please try again.", {
          RATE_LIMITED: "Too many requests. Please wait a moment.",
        }),
      );
    }
  };

  return (
    <div className="password-reset-cont">
      <div className="login-inner password-reset-inner" aria-live="polite">
        <div className="login-t text-3xl">
          <p>FORGOT PASSWORD</p>
        </div>

        {isSent ? (
          <>
            <p className="password-reset-copy">
              If an account exists for this email, a reset link is on its way.
              It stays valid for 30 minutes. Check your spam folder too.
            </p>
            <div className="signup_btn">
              <GreenBoxBtn title="Back to Login" type="button" href="/login" />
            </div>
          </>
        ) : (
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <p className="password-reset-copy">
              Enter your account email and we&apos;ll send you a link to set a
              new password.
            </p>
            <div className="inp-rel">
              <label className="sr-only" htmlFor="forgot-password-email">
                Email
              </label>
              <input
                id="forgot-password-email"
                className="login-inp text-lg"
                placeholder="Email"
                type="email"
                autoComplete="email"
                required
                {...register("email")}
              />
              {errors?.email && (
                <div className="error-p">
                  <p>{errors?.email?.message || ""}</p>
                </div>
              )}
            </div>
            <div className="signup_btn">
              <GreenBoxBtn title="Send Reset Link" loading={loading} />
            </div>
          </form>
        )}

        <div className="not-up">
          <p>
            Remembered it? <Link href="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordClient;
