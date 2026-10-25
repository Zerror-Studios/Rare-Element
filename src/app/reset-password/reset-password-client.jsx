"use client";

/**
 * Reset password form (PRD-003 FR-0.5)
 *
 * Reads `token` once from the query string, removes it from the address
 * bar (so it doesn't linger in history or analytics URLs), then lets the
 * shopper choose a new password. `customerResetPassword` consumes the
 * token once; an invalid, used or expired token answers
 * `INVALID_RESET_TOKEN`, which shows the "request a new link" state.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/components/login/ResetPassword.jsx`.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_MESSAGE,
} from "@/utils/Constant";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { CUSTOMER_RESET_PASSWORD } from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { getErrorInfo, getErrorMessage } from "@/utils/errors";

// ─── Constants ────────────────────────────────────────────────────────────

const StatusEnum = {
  FORM: "FORM",
  DONE: "DONE",
  INVALID_LINK: "INVALID_LINK",
};

const PAGE_PATH = "/reset-password";

const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, PASSWORD_MIN_MESSAGE),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ─── Component ────────────────────────────────────────────────────────────

const ResetPasswordClient = () => {
  const searchParams = useSearchParams();
  const tokenRef = useRef(null);
  const [status, setStatus] = useState(StatusEnum.FORM);
  const [visible, setVisible] = useState(false);
  const [resetPassword, { loading }] = useMutation(CUSTOMER_RESET_PASSWORD);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ResetPasswordSchema),
  });

  /* ----- Effects ----- */
  useEffect(() => {
    // Once per page view (also under React Strict Mode's double effect).
    if (tokenRef.current !== null) return;
    tokenRef.current = searchParams.get("token") || "";
    window.history.replaceState(null, "", PAGE_PATH);
    if (!tokenRef.current) setStatus(StatusEnum.INVALID_LINK);
  }, [searchParams]);

  /* ----- Handlers ----- */
  const onSubmit = async (formData) => {
    try {
      await resetPassword({
        variables: {
          token: tokenRef.current,
          newPassword: formData.newPassword,
        },
      });
      setStatus(StatusEnum.DONE);
    } catch (err) {
      if (getErrorInfo(err).reason === "INVALID_RESET_TOKEN") {
        setStatus(StatusEnum.INVALID_LINK);
        return;
      }
      toast.error(
        getErrorMessage(err, "We couldn't reset your password. Please try again."),
      );
    }
  };

  return (
    <div className="password-reset-cont">
      <div className="login-inner password-reset-inner" aria-live="polite">
        <div className="login-t text-3xl">
          <p>RESET PASSWORD</p>
        </div>

        {status === StatusEnum.DONE && (
          <>
            <p className="password-reset-copy">
              Your password has been updated and you&apos;ve been signed out
              everywhere. Log in with your new password.
            </p>
            <div className="signup_btn">
              <GreenBoxBtn title="Go to Login" type="button" href="/login" />
            </div>
          </>
        )}

        {status === StatusEnum.INVALID_LINK && (
          <>
            <p className="password-reset-copy">
              This reset link is invalid or has expired. Links work once and
              stay valid for 30 minutes.
            </p>
            <div className="signup_btn">
              <GreenBoxBtn
                title="Request a New Link"
                type="button"
                href="/forgot-password"
              />
            </div>
          </>
        )}

        {status === StatusEnum.FORM && (
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="pass-cont inp-rel">
              <button
                type="button"
                className="eye-cont flex-all"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <RiEyeLine size={20} /> : <RiEyeOffLine size={20} />}
              </button>
              <label className="sr-only" htmlFor="reset-new-password">
                New password
              </label>
              <input
                id="reset-new-password"
                className="login-inp text-lg"
                type={visible ? "text" : "password"}
                placeholder="New password"
                autoComplete="new-password"
                required
                {...register("newPassword")}
              />
              {errors?.newPassword && (
                <div className="error-p">
                  <p>{errors?.newPassword?.message || ""}</p>
                </div>
              )}
            </div>
            <div className="inp-rel">
              <label className="sr-only" htmlFor="reset-confirm-password">
                Confirm new password
              </label>
              <input
                id="reset-confirm-password"
                className="login-inp text-lg"
                type={visible ? "text" : "password"}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                {...register("confirmPassword")}
              />
              {errors?.confirmPassword && (
                <div className="error-p">
                  <p>{errors?.confirmPassword?.message || ""}</p>
                </div>
              )}
            </div>
            <div className="signup_btn">
              <GreenBoxBtn title="Set New Password" loading={loading} />
            </div>
          </form>
        )}

        <div className="not-up">
          <p>
            <Link href="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordClient;
