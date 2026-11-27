"use client";

/**
 * Sign-up pop-up (backend PRD-050 D22; kit 2.1.0 `useSignupPopup`)
 *
 * Shows the store's ACTIVE pop-up form (dashboard Marketing › Forms) as a
 * modal in Nahara's styling, taking the merchant's colours and corner
 * radius. The kit applies the merchant's rules (pages, delay, exit intent
 * on a computer, frequency, hide rules; never on checkout, cart, account or
 * order pages), waits for the consent banner, traps focus, locks the page
 * scroll without a layout shift, closes on Escape and the backdrop only
 * when the merchant allows it, returns focus and records the view.
 * Without an ACTIVE pop-up nothing renders. Every text of a form is plain
 * text. A sign-up shows the form's success message and is remembered, so
 * the pop-up doesn't come back.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/common/SignupPopup.jsx`.
 */

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { RiCloseLine } from "@remixicon/react";
import { useSignupForm, useSignupPopup } from "@zcom/storefront-kit/client";

import { EMAIL_CONFIRMATION_HINT, getSignupFormMessage } from "@/utils/email-consent";
import {
  getSignupPageType,
  getSignupPopupButtonText,
  getSignupPopupStyle,
  SIGNUP_POPUP_BLOCKED_PATHS,
} from "@/utils/signup-popup";

// ─── Form ─────────────────────────────────────────────────────────────────

const PopupForm = ({ popup }) => {
  const { form, view, titleId, descriptionId } = popup;
  const signup = useSignupForm(form._id, { form, idPrefix: `signup_popup_${form._id}` });
  const status = getSignupFormMessage(signup.state, signup.retryAfterMs, signup.message);
  const isSending = signup.state === "sending";
  const isDone = signup.state === "pending";
  const emailProps = signup.inputProps("email");
  const nameProps = signup.inputProps("firstName");
  const describedBy = `${titleId}_notice ${titleId}_message`;

  return (
    <>
      <h2 id={titleId} className="signup_popup_title text-xl uppercase">
        {view.heading || "Join our newsletter"}
      </h2>
      {view.description ? (
        <p id={descriptionId} className="signup_popup_description text-sm">
          {view.description}
        </p>
      ) : null}
      {isDone ? null : (
        <form className="signup_popup_form" onSubmit={signup.handleSubmit} noValidate>
          {nameProps ? (
            <div className="signup_popup_field">
              <label htmlFor={nameProps.id} className="text-xs uppercase">
                {nameProps.required ? "First name" : "First name (optional)"}
              </label>
              <input
                {...nameProps}
                className="signup_popup_input text-base"
                aria-describedby={describedBy}
              />
            </div>
          ) : null}
          {emailProps ? (
            <div className="signup_popup_field">
              <label htmlFor={emailProps.id} className="text-xs uppercase">
                Email
              </label>
              <input
                {...emailProps}
                className="signup_popup_input text-base"
                aria-describedby={describedBy}
              />
            </div>
          ) : null}
          {signup.honeypotProps ? (
            <div className="visually_hidden" aria-hidden="true">
              <label htmlFor={signup.honeypotProps.id}>{view.honeypot.label}</label>
              <input {...signup.honeypotProps} />
            </div>
          ) : null}
          <button
            type="submit"
            className="signup_popup_submit text-sm uppercase"
            disabled={isSending}
          >
            {getSignupPopupButtonText(signup.state, view.buttonText)}
          </button>
          <p id={`${titleId}_notice`} className="signup_popup_notice text-xs">
            {view.consentText} {EMAIL_CONFIRMATION_HINT}
          </p>
        </form>
      )}
      <p
        id={`${titleId}_message`}
        className={`signup_popup_message text-sm ${status.isError ? "is_error" : ""}`}
        role={status.isError ? "alert" : "status"}
        aria-live={status.isError ? "assertive" : "polite"}
      >
        {status.text}
      </p>
      {isDone ? (
        <button
          type="button"
          className="signup_popup_submit text-sm uppercase"
          onClick={() => popup.close()}
        >
          Continue shopping
        </button>
      ) : null}
    </>
  );
};

// ─── Component ────────────────────────────────────────────────────────────

const SignupPopup = () => {
  const pathname = usePathname() || "/";
  const popup = useSignupPopup({
    pathname,
    pageType: getSignupPageType(pathname),
    blockedPaths: SIGNUP_POPUP_BLOCKED_PATHS,
  });

  // Lenis scrolls the page itself; the kit's scroll lock covers the rest
  useEffect(() => {
    if (!popup.open || typeof window === "undefined" || !window.lenis) return;
    window.lenis.stop();
    return () => window.lenis?.start();
  }, [popup.open]);

  if (!popup.open || !popup.form || !popup.view) return null;

  return (
    <div
      className={`signup_popup_backdrop ${popup.reducedMotion ? "is_still" : ""}`}
      data-lenis-prevent
      {...popup.backdropProps}
    >
      <div
        {...popup.dialogProps}
        className="signup_popup"
        style={getSignupPopupStyle(popup.view.styleVars)}
      >
        <button {...popup.closeButtonProps} className="signup_popup_close">
          <RiCloseLine size={18} aria-hidden="true" />
        </button>
        <PopupForm popup={popup} />
      </div>
    </div>
  );
};

export default SignupPopup;
