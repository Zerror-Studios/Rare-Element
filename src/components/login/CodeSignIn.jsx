"use client";

/**
 * Sign in with an email code (backend PRD-041 FR-9, FR-10, FR-12) on the
 * kit's `useCodeSignIn` (kit 1.1.0). It is also the sign-up: a new email
 * gets its account at the first code; name and phone are filled later in
 * Account › Settings.
 *
 * Email → Continue → "Enter the code we sent to a•••@gmail.com" (one
 * input, `autocomplete="one-time-code"`: paste and email/SMS autofill
 * work; six digits submit on their own) → signed in, the guest bag merged
 * by the kit, the store's state brought in step (`completeCodeSignIn`),
 * then `?next=` (`getNextPath`). "Resend code" after the kit's countdown
 * (60 s, or the server's `retryAfterMs`), "Use a different email", and
 * "Sign in with password instead" for customers who have one (FR-11).
 */

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LOGIN_CODE_LENGTH, useCodeSignIn } from "@zcom/storefront-kit/client";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
import { useAuth } from "@/context/AuthContext";
import { getKitKeyMessage } from "@/utils/errors";
import { getNextPath } from "@/utils/redirect";

// ─── Constants ────────────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CODE_MESSAGES = {
  INVALID_LOGIN_CODE:
    "That code isn't right or has expired. Check it, or request a new code.",
  RATE_LIMITED: "Too many tries. Please wait, then request a new code.",
};

// ─── Component ────────────────────────────────────────────────────────────

const CodeSignIn = ({ onUsePassword, inactive = false }) => {
  const router = useRouter();
  const { completeCodeSignIn } = useAuth();
  const signIn = useCodeSignIn();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [code, setCode] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const codeInputRef = useRef(null);
  // The last code sent, so a re-render never submits the same one twice
  const submittedCodeRef = useRef("");

  const isCodeStep = signIn.step === "code";
  const errorMessage = signIn.error
    ? getKitKeyMessage(signIn.error, CODE_MESSAGES)
    : "";

  useEffect(() => {
    if (isCodeStep) codeInputRef.current?.focus();
  }, [isCodeStep]);

  const onRequestCode = async (event) => {
    event.preventDefault();
    if (signIn.busy) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setCode("");
    submittedCodeRef.current = "";
    await signIn.requestCode(value);
  };

  const verify = async (value) => {
    if (signIn.busy || isFinishing) return;
    submittedCodeRef.current = value;
    const result = await signIn.verifyCode(value);
    if (!result) return;
    setIsFinishing(true);
    try {
      await completeCodeSignIn(result);
      toast.success("You're signed in.");
    } catch {
      // The session is live; the profile loads again on the next page
    }
    router.replace(getNextPath());
  };

  const onCodeChange = (event) => {
    const digits = event.target.value
      .replace(/\D/g, "")
      .slice(0, LOGIN_CODE_LENGTH);
    setCode(digits);
    // Six digits (typed, pasted or autofilled) submit once
    if (
      digits.length === LOGIN_CODE_LENGTH &&
      submittedCodeRef.current !== digits
    ) {
      void verify(digits);
    }
  };

  const onSubmitCode = (event) => {
    event.preventDefault();
    void verify(code);
  };

  const onResend = async () => {
    if (signIn.resendIn > 0 || signIn.busy) return;
    setCode("");
    submittedCodeRef.current = "";
    const sent = await signIn.requestCode();
    if (sent) toast.info(`We sent a new code to ${signIn.maskedEmail}.`);
  };

  const onDifferentEmail = () => {
    setCode("");
    submittedCodeRef.current = "";
    signIn.reset();
  };

  return (
    <div className="left-two" inert={inactive || undefined}>
      <div className="login-inner">
        <div className="login-t text-3xl">
          <p>SIGN IN</p>
        </div>

        {!isCodeStep ? (
          <form className="login-form" onSubmit={onRequestCode} noValidate>
            <p className="login-copy text-base">
              Enter your email and we&apos;ll send you a 6-digit code. New
              here? The same code creates your account.
            </p>
            <div className="inp-rel">
              <input
                className="login-inp text-lg"
                type="email"
                placeholder="Email"
                aria-label="Email"
                autoComplete="email"
                value={email}
                aria-invalid={Boolean(emailError)}
                onChange={(event) => setEmail(event.target.value)}
              />
              {emailError && (
                <div className="error-p">
                  <p>{emailError}</p>
                </div>
              )}
            </div>
            {errorMessage && (
              <p className="login-error text-sm" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="signup_btn">
              <GreenBoxBtn title={"Continue"} loading={signIn.busy} />
            </div>
          </form>
        ) : (
          <form className="login-form" onSubmit={onSubmitCode} noValidate>
            <p className="login-copy text-base" aria-live="polite">
              Enter the code we sent to <strong>{signIn.maskedEmail}</strong>
            </p>
            <div className="inp-rel">
              <input
                ref={codeInputRef}
                className="login-inp login-code-inp text-lg"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={LOGIN_CODE_LENGTH}
                placeholder="6-digit code"
                aria-label="6-digit code"
                aria-invalid={signIn.error === "INVALID_LOGIN_CODE"}
                value={code}
                onChange={onCodeChange}
              />
            </div>
            {errorMessage && (
              <p className="login-error text-sm" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="signup_btn">
              <GreenBoxBtn
                title={"Sign in"}
                loading={signIn.busy || isFinishing}
              />
            </div>
            <div className="login-code-actions">
              <button
                type="button"
                className="login-text-btn text-sm"
                onClick={onResend}
                disabled={signIn.resendIn > 0 || signIn.busy}
              >
                {signIn.resendIn > 0
                  ? `Resend code in ${signIn.resendIn}s`
                  : "Resend code"}
              </button>
              <button
                type="button"
                className="login-text-btn text-sm"
                onClick={onDifferentEmail}
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        <div className="not-up">
          <p>
            Have a password?{" "}
            <button
              type="button"
              className="login-text-btn text-base"
              onClick={onUsePassword}
            >
              Sign in with password instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodeSignIn;
