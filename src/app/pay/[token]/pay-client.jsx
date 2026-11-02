"use client";

/**
 * Payment request page client (PRD-028 FR-5, FR-10)
 *
 * Shows the order summary the server read and one "Pay" button:
 * `payPaymentRequest(token)` returns the provider-neutral checkout, which
 * `openPaymentCheckout` opens like the checkout page does. A guest can't
 * call `verifyPayment`, so the payment app's answer goes to
 * `verifyPaymentRequestPayment(token, payload)` (checked with the
 * provider server to server). While that is pending, or after a return
 * from a redirect app (`?confirm=1`, already verified by payment-return),
 * the page asks `getPaymentRequest` again until the backend reads PAID. Every call is anonymous (`skipAuth`) and nothing is
 * sent to analytics. States come from `utils/payment-request.js`, which
 * reads only `extensions.code` / `reason`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/pages/pay/[token].jsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  GET_PAYMENT_REQUEST,
  PAY_PAYMENT_REQUEST,
  VERIFY_PAYMENT_REQUEST_PAYMENT,
} from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { getErrorInfo } from "@/utils/errors";
import { openPaymentCheckout } from "@/utils/payment-checkout";
import { SUPPORT_EMAIL } from "@/utils/env";
import {
  PAY_CONFIRM_POLL_MS,
  PAY_CONFIRM_TIMEOUT_MS,
  PAY_VIEW_COPY,
  PayViewEnum,
  RETRYABLE_VIEWS,
  clearPayReturn,
  formatAmount,
  formatExpiry,
  savePayReturn,
  viewFromError,
  viewFromRequest,
  viewFromVerification,
} from "@/utils/payment-request";

// ─── Constants ────────────────────────────────────────────────────────────

const ANONYMOUS = { context: { skipAuth: true } };

function sessionStore() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

// ─── Component ────────────────────────────────────────────────────────────

const PayClient = ({ token, request, initialView }) => {
  const client = useApolloClient();
  const [payRequest] = useMutation(PAY_PAYMENT_REQUEST, ANONYMOUS);
  const [verifyRequest] = useMutation(
    VERIFY_PAYMENT_REQUEST_PAYMENT,
    ANONYMOUS,
  );
  const [view, setView] = useState(initialView);
  const [isPaying, setIsPaying] = useState(false);
  const [isStillChecking, setIsStillChecking] = useState(false);
  const headingRef = useRef(null);
  const pollRef = useRef(null);

  const readStatus = useCallback(async () => {
    try {
      const { data } = await client.query({
        query: GET_PAYMENT_REQUEST,
        variables: { token },
        fetchPolicy: "network-only",
        ...ANONYMOUS,
      });
      return viewFromRequest(data?.getPaymentRequest ?? null);
    } catch (error) {
      return viewFromError(getErrorInfo(error));
    }
  }, [client, token]);

  // CONFIRMING: ask again until PAID (or any final state), then stop
  const confirm = useCallback(() => {
    clearTimeout(pollRef.current);
    setIsStillChecking(false);
    setView(PayViewEnum.CONFIRMING);
    const startedAt = Date.now();
    const tick = async () => {
      const next = await readStatus();
      if (next === PayViewEnum.READY || next === PayViewEnum.RATE_LIMITED || next === PayViewEnum.ERROR) {
        if (Date.now() - startedAt >= PAY_CONFIRM_TIMEOUT_MS) {
          setIsStillChecking(true);
          return;
        }
        pollRef.current = setTimeout(tick, PAY_CONFIRM_POLL_MS);
        return;
      }
      if (next === PayViewEnum.PAID) clearPayReturn(sessionStore());
      setView(next);
    };
    tick();
  }, [readStatus]);

  useEffect(() => {
    if (initialView === PayViewEnum.CONFIRMING) {
      // Back from a redirect payment app: drop the address-bar flag
      window.history.replaceState(null, "", `/pay/${encodeURIComponent(token)}`);
      confirm();
    }
    return () => clearTimeout(pollRef.current);
  }, [initialView, token, confirm]);

  // Move focus to the new heading when the state changes (screen readers)
  useEffect(() => {
    if (view !== initialView) headingRef.current?.focus();
  }, [view, initialView]);

  // The provider answered: check it with the provider server to server
  // (PRD-028 FR-5.1); a pending or unreadable answer falls back to polling
  const verifyThenConfirm = useCallback(
    async (payload) => {
      setView(PayViewEnum.CONFIRMING);
      try {
        const { data } = await verifyRequest({ variables: { token, payload } });
        const next = viewFromVerification(data?.verifyPaymentRequestPayment);
        if (next !== PayViewEnum.CONFIRMING) {
          clearPayReturn(sessionStore());
          setIsPaying(false);
          setView(next);
          return;
        }
      } catch {
        // Polling below still reads the outcome from the backend
      }
      confirm();
    },
    [verifyRequest, token, confirm],
  );

  const pay = useCallback(async () => {
    setIsPaying(true);
    try {
      const { data } = await payRequest({ variables: { token } });
      savePayReturn(sessionStore(), token);
      await openPaymentCheckout(data?.payPaymentRequest, {
        onResult: (payload) => verifyThenConfirm(payload),
        onDismiss: () => {
          clearPayReturn(sessionStore());
          setIsPaying(false);
        },
      });
    } catch (error) {
      clearPayReturn(sessionStore());
      setIsPaying(false);
      setView(viewFromError(getErrorInfo(error)));
    }
  }, [payRequest, token, verifyThenConfirm]);

  const retry = useCallback(async () => {
    setIsPaying(false);
    setView(await readStatus());
  }, [readStatus]);

  const copy = PAY_VIEW_COPY[view] || PAY_VIEW_COPY[PayViewEnum.ERROR];
  const amountLabel = request ? formatAmount(request.amount, request.currency) : "";
  const expiry = request ? formatExpiry(request.expiresAt) : "";

  return (
    <div className="status_section center pay_section">
      <div
        className="status_section_inner pay_section_inner"
        aria-live="polite"
        aria-busy={view === PayViewEnum.CONFIRMING}
      >
        {request?.storeName && <p className="pay_store uppercase">{request.storeName}</p>}
        <h1 className="text-3xl font-bold" tabIndex={-1} ref={headingRef}>
          {copy.title}
        </h1>

        {view === PayViewEnum.READY && request && (
          <>
            {request.orderNo && <p className="uppercase">Order {request.orderNo}</p>}
            <ul className="pay_lines" aria-label="Items in this order">
              {(request.lines || []).map((line, index) => (
                <li className="pay_line" key={`${line.name}-${index}`}>
                  <span>
                    {line.name}
                    {line.variant && <span className="pay_variant"> · {line.variant}</span>}
                    <span className="pay_variant"> × {line.quantity}</span>
                  </span>
                  <span>{formatAmount(line.lineTotal, request.currency)}</span>
                </li>
              ))}
              {request.moreLines > 0 && (
                <li className="pay_line pay_variant">and {request.moreLines} more</li>
              )}
            </ul>
            <p className="pay_total">
              <span>Amount due</span>
              <strong>{amountLabel}</strong>
            </p>
            {request.customerNote && <p className="pay_note">{request.customerNote}</p>}
            {expiry && <p className="pay_variant">This link works until {expiry}.</p>}
            <div className="w-full">
              <GreenBoxBtn
                title={`Pay ${amountLabel}`}
                type="button"
                onClick={pay}
                loading={isPaying}
                aria-label={`Pay ${amountLabel} for order ${request.orderNo || ""}`.trim()}
              />
            </div>
            <p className="pay_variant">Payments are processed securely by the store&apos;s payment provider.</p>
          </>
        )}

        {view !== PayViewEnum.READY && copy.message && (
          <p className="uppercase mt-2">{copy.message}</p>
        )}

        {view === PayViewEnum.CONFIRMING && isStillChecking && (
          <div className="w-full">
            <GreenBoxBtn title="Check again" type="button" onClick={confirm} />
          </div>
        )}

        {RETRYABLE_VIEWS.includes(view) && (
          <div className="w-full">
            <GreenBoxBtn title="Try again" type="button" onClick={retry} />
          </div>
        )}

        {view !== PayViewEnum.READY && view !== PayViewEnum.CONFIRMING && (
          <>
            <p className="mt-4">Have a question? Contact us at:</p>
            <Link className="underline text-blue-600 block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </Link>
            <div className="w-full mt-8">
              <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayClient;
