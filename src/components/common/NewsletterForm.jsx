"use client";

/**
 * Newsletter sign-up (PRD-014 FR-2.8, UX-29)
 *
 * Calls `subscribeNewsletter(email)`. The answer is the same whether or not
 * the email was already on the list, so the form only ever says "you're
 * subscribed". Every campaign email carries the unsubscribe link
 * (`/unsubscribe`).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/components/common/NewsletterForm.jsx`.
 */

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";

import { SUBSCRIBE_NEWSLETTER } from "@/graphql";
import { getErrorMessage } from "@/utils/errors";

// ─── Constants ────────────────────────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

const NewsletterStatusEnum = {
  IDLE: "IDLE",
  DONE: "DONE",
  ERROR: "ERROR",
};

// ─── Component ────────────────────────────────────────────────────────────

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(NewsletterStatusEnum.IDLE);
  const [message, setMessage] = useState("");
  const [subscribe, { loading }] = useMutation(SUBSCRIBE_NEWSLETTER);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setStatus(NewsletterStatusEnum.ERROR);
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      await subscribe({ variables: { email: value } });
      setStatus(NewsletterStatusEnum.DONE);
      setMessage("You're subscribed. Look out for our next note.");
      setEmail("");
    } catch (error) {
      setStatus(NewsletterStatusEnum.ERROR);
      setMessage(
        getErrorMessage(error, "We couldn't sign you up. Please try again."),
      );
    }
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
          aria-invalid={status === NewsletterStatusEnum.ERROR}
          aria-describedby="newsletter_message"
        />
        <button
          type="submit"
          className="newsletter_submit text-sm uppercase"
          disabled={loading}
        >
          {loading ? "Signing up…" : "Subscribe"}
        </button>
      </div>
      <p
        id="newsletter_message"
        className={`newsletter_message text-xs ${status === NewsletterStatusEnum.ERROR ? "is_error" : ""}`}
        role={status === NewsletterStatusEnum.ERROR ? "alert" : "status"}
      >
        {message}
      </p>
    </form>
  );
};

export default NewsletterForm;
