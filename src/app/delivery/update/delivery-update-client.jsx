"use client";

/**
 * Delivery update client (backend PRD-051 FR-12)
 *
 * Reads the `token` once and removes it from the address bar (so it
 * doesn't linger in history or analytics page URLs), then loads the page
 * through the kit's `useDeliveryUpdate` and saves the shopper's new
 * address, phone or day.
 *
 * Needs `@zcom/storefront-kit` with `useDeliveryUpdate` (kit branch
 * `feat/prd-051-whatsapp`, not released yet). This store is still on kit
 * v2.1.0: until the kit release is installed the hook is missing and the
 * page shows a "reply on WhatsApp" note instead of the form (the namespace
 * import keeps the build working either way).
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/views/DeliveryUpdateView.jsx`.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as kitClient from "@zcom/storefront-kit/client";
import * as kitCore from "@zcom/storefront-kit/core";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { SUPPORT_EMAIL } from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

const PAGE_PATH = "/delivery/update";

const FIELDS = [
  { name: "address1", label: "Address", autoComplete: "address-line1" },
  { name: "address2", label: "Apartment, landmark (optional)", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "pincode", label: "PIN code", autoComplete: "postal-code", inputMode: "numeric" },
  { name: "phone", label: "Phone", autoComplete: "tel", type: "tel" },
];

const STATUS_COPY = {
  CLOSED: {
    title: "This delivery can't be changed any more",
    text: "It was delivered, sent back, or the store has already arranged the next attempt.",
  },
  EXPIRED: {
    title: "This link has expired",
    text: "Reply to our WhatsApp message and we'll help you with the delivery.",
  },
  INVALID: {
    title: "This link isn't valid",
    text: "Please use the link from our WhatsApp message or email.",
  },
};

// ─── Components ───────────────────────────────────────────────────────────

const Shell = ({ children, busy = false }) => (
  <div className="status_section center">
    <div className="status_section_inner" aria-live="polite" aria-busy={busy}>
      {children}
      <p className="mt-6">Have a question? Contact us at:</p>
      <Link className="underline text-blue-600 block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>
        {SUPPORT_EMAIL}
      </Link>
    </div>
  </div>
);

/** The kit release with the hook isn't installed yet. */
const NotAvailable = () => (
  <Shell>
    <h1 className="text-3xl font-bold">Update your delivery</h1>
    <p className="uppercase mt-2">
      Reply to our WhatsApp message with the new address or phone number and we&apos;ll pass it to the courier.
    </p>
  </Shell>
);

const DeliveryUpdateForm = ({ token }) => {
  const { status, page, loading, error, canSubmit, submit, saving, saveError } =
    kitClient.useDeliveryUpdate(token);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const errorCopy = kitCore.DELIVERY_UPDATE_ERROR_COPY || {};

  const onChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const onSubmit = async (event) => {
    event.preventDefault();
    const result = await submit(form);
    if (result) setSaved(true);
  };

  if (loading && !page) {
    return (
      <Shell busy>
        <h1 className="text-3xl font-bold">Loading…</h1>
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="uppercase mt-2">{errorCopy[error] || "Please try again in a moment."}</p>
      </Shell>
    );
  }
  if (!canSubmit) {
    const copy = STATUS_COPY[status] || STATUS_COPY.INVALID;
    return (
      <Shell>
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p className="uppercase mt-2">{copy.text}</p>
        <div className="w-full mt-8">
          <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold">Update your delivery</h1>
      <p className="mt-2">
        The courier couldn&apos;t deliver order {page?.orderNo || ""}
        {page?.city ? ` to ${page.city}${page.pincode ? ` ${page.pincode}` : ""}` : ""}. Tell us what to change and
        we&apos;ll ask them to try again.
      </p>
      {saved || page?.status === "SUBMITTED" ? (
        <p className="mt-4 font-bold" role="status">
          Thank you, we&apos;ve got your details. You can still change them below.
        </p>
      ) : null}
      <form className="w-full mt-6 flex flex-col gap-3 text-left" onSubmit={onSubmit} noValidate>
        {FIELDS.map((field) => (
          <label key={field.name} className="flex flex-col gap-1">
            <span className="text-sm">{field.label}</span>
            <input
              className="border border-black/30 px-3 py-2 w-full"
              name={field.name}
              type={field.type || "text"}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              value={form[field.name] || ""}
              onChange={onChange}
            />
          </label>
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-sm">Deliver on (optional)</span>
          <input
            className="border border-black/30 px-3 py-2 w-full"
            name="preferredDate"
            type="date"
            min={page?.earliestDate}
            max={page?.latestDate}
            value={form.preferredDate || ""}
            onChange={onChange}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Note for the courier (optional)</span>
          <textarea
            className="border border-black/30 px-3 py-2 w-full"
            name="note"
            rows={3}
            maxLength={500}
            value={form.note || ""}
            onChange={onChange}
          />
        </label>
        {saveError ? (
          <p className="text-red-600" role="alert">
            {errorCopy[saveError] || "Something went wrong. Try again."}
          </p>
        ) : null}
        <div className="w-full mt-2">
          <GreenBoxBtn title={saving ? "Saving…" : "Save delivery details"} type="submit" disabled={saving} />
        </div>
      </form>
    </Shell>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────

const DeliveryUpdateClient = () => {
  const tokenRef = useRef(undefined);
  const [token, setToken] = useState(undefined);

  useEffect(() => {
    // Once per page view: read the link, then drop it from the address bar
    if (tokenRef.current !== undefined) return;
    const read = kitCore.deliveryUpdateTokenOf
      ? kitCore.deliveryUpdateTokenOf(window.location.search)
      : null;
    tokenRef.current = read;
    window.history.replaceState(null, "", PAGE_PATH);
    setToken(read);
  }, []);

  if (typeof kitClient.useDeliveryUpdate !== "function") return <NotAvailable />;
  if (token === undefined) return null;
  return <DeliveryUpdateForm token={token} />;
};

export default DeliveryUpdateClient;
