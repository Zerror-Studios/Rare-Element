"use client";

/**
 * Newsletter sign-up (backend PRD-050 FR-3.6, FR-3.8; was PRD-014 FR-2.8)
 *
 * The kit's `useEmailSignup` calls `subscribeNewsletter(email)`, which
 * starts double opt-in: the address waits for the shopper's click on the
 * emailed link (`/email/confirm`) before any news is sent, so the form
 * always says "check your inbox" (the answer is the same whether or not the
 * address was already on the list). A hidden honeypot field catches bots,
 * and the kit throttles repeat sign-ups before the server's own limits.
 * Nothing about the address goes to analytics.
 *
 * When the store has an ACTIVE footer sign-up form, else an ACTIVE inline
 * one (dashboard Marketing › Forms; kit 2.1.0 `useStorefrontSignupForms`,
 * `pickFooterSignupForm`, `useSignupForm`, backend PRD-050 FR-3.8, D20,
 * D22), the footer shows that form instead: its heading,
 * description, first-name field, button text, consent text (sent back
 * with its notice version) and success message, in this footer's own
 * styling (the form's colours are not applied here). Without one, while it
 * loads, on an error, or once it is paused, the footer keeps today's
 * newsletter form. Every text of a form is plain text. The store's form
 * counts one view per browser session once half of it is on screen (kit
 * `useSignupFormView`, D22). The forms list is read for every kind, the
 * same request as the pop-up's (`SignupPopup.jsx`).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/common/NewsletterForm.jsx`.
 */

import React, { useState } from "react";
import {
  useEmailSignup,
  useSignupForm,
  useSignupFormView,
  useStorefrontSignupForms,
} from "@zcom/storefront-kit/client";
import { pickFooterSignupForm } from "@zcom/storefront-kit/core";

import {
  EMAIL_CONFIRMATION_HINT,
  getSignupFormMessage,
  getSignupMessage,
} from "@/utils/email-consent";

// ─── Constants ────────────────────────────────────────────────────────────

const EMAIL_MAX_LENGTH = 254;
// The kit's SIGNUP_HONEYPOT_FIELD
const HONEYPOT_NAME = "company_website";

// ─── Today's newsletter form ──────────────────────────────────────────────

const DefaultNewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const { submit, state, retryAfterMs } = useEmailSignup();
  const isSending = state === "sending";
  const message = getSignupMessage(state, retryAfterMs);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSending) return;
    const next = await submit({ email, honeypot });
    if (next === "pending") setEmail("");
  };

  return (
    <form className="newsletter_form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="newsletter_email" className="newsletter_label text-sm uppercase">
        Join our newsletter
      </label>
      <div className="newsletter_field">
        <input
          id="newsletter_email"
          type="email"
          name="email"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email"
          className="newsletter_input text-base"
          aria-invalid={message.isError}
          aria-describedby="newsletter_notice newsletter_message"
        />
        <button
          type="submit"
          className="newsletter_submit text-sm uppercase"
          disabled={isSending}
        >
          {isSending ? "Signing up…" : "Subscribe"}
        </button>
      </div>
      <div className="visually_hidden" aria-hidden="true">
        <label htmlFor="newsletter_company_website">Leave this empty</label>
        <input
          id="newsletter_company_website"
          type="text"
          name={HONEYPOT_NAME}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
      <p id="newsletter_notice" className="newsletter_notice text-xs">
        News and offers from Nahara. {EMAIL_CONFIRMATION_HINT}
      </p>
      <p
        id="newsletter_message"
        className={`newsletter_message text-xs ${message.isError ? "is_error" : ""}`}
        role={message.isError ? "alert" : "status"}
      >
        {message.text}
      </p>
    </form>
  );
};

// ─── The store's own form (Marketing › Forms) ─────────────────────────────

const StoreSignupForm = ({ form }) => {
  const {
    view,
    unavailable,
    inputProps,
    honeypotProps,
    handleSubmit,
    state,
    message,
    retryAfterMs,
  } = useSignupForm(form._id, { form, idPrefix: "newsletter" });
  const viewRef = useSignupFormView(form._id, { skip: !view || unavailable });
  if (!view || unavailable) return <DefaultNewsletterForm />;

  const isSending = state === "sending";
  const status = getSignupFormMessage(state, retryAfterMs, message);
  const emailProps = inputProps("email");
  const nameProps = inputProps("firstName");
  const describedBy = "newsletter_notice newsletter_message";

  return (
    <form ref={viewRef} className="newsletter_form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={emailProps.id} className="newsletter_label text-sm uppercase">
        {view.heading || "Join our newsletter"}
      </label>
      {view.description ? (
        <p className="newsletter_description text-xs">{view.description}</p>
      ) : null}
      {nameProps ? (
        <div className="newsletter_field newsletter_field_name">
          <input
            {...nameProps}
            placeholder={nameProps.required ? "First name" : "First name (optional)"}
            aria-label="First name"
            className="newsletter_input text-base"
            aria-describedby={describedBy}
          />
        </div>
      ) : null}
      <div className="newsletter_field">
        <input
          {...emailProps}
          placeholder="Your email"
          className="newsletter_input text-base"
          aria-describedby={describedBy}
        />
        <button
          type="submit"
          className="newsletter_submit text-sm uppercase"
          disabled={isSending}
        >
          {isSending ? "Signing up…" : view.buttonText}
        </button>
      </div>
      <div className="visually_hidden" aria-hidden="true">
        <label htmlFor={honeypotProps.id}>{view.honeypot.label}</label>
        <input {...honeypotProps} />
      </div>
      <p id="newsletter_notice" className="newsletter_notice text-xs">
        {view.consentText} {EMAIL_CONFIRMATION_HINT}
      </p>
      <p
        id="newsletter_message"
        className={`newsletter_message text-xs ${status.isError ? "is_error" : ""}`}
        role={status.isError ? "alert" : "status"}
      >
        {status.text}
      </p>
    </form>
  );
};

// ─── Component ────────────────────────────────────────────────────────────

const NewsletterForm = () => {
  // Every kind: the same request as the pop-up's
  const { forms } = useStorefrontSignupForms(null);
  const form = pickFooterSignupForm(forms);
  return form ? <StoreSignupForm key={form._id} form={form} /> : <DefaultNewsletterForm />;
};

export default NewsletterForm;
