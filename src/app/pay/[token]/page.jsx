/**
 * Payment request page (PRD-028 FR-5, FR-10)
 *
 * `/pay/<token>`: the link a store sends for an order taken by phone, in
 * the studio or on WhatsApp. Rendered per request from
 * `getPaymentRequest(token)` with the shopper's IP (the backend limits
 * reads per IP), never cached and never indexed. No login, no cart, and
 * no analytics event carries the order. `?confirm=1` is where the
 * payment-return page sends a shopper back from a redirect payment app.
 */

import { headers } from "next/headers";
import { getClient } from "@/lib/apollo-client-rsc";
import { CLIENT_IP_HEADER, getClientIp } from "@/lib/edge-headers";
import { GET_PAYMENT_REQUEST } from "@/graphql";
import { getErrorInfo } from "@/utils/errors";
import {
  PayViewEnum,
  isPaymentRequestToken,
  viewFromError,
  viewFromRequest,
} from "@/utils/payment-request";
import PayClient from "./pay-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pay for your order | Nahara",
  description: "Pay for your Nahara order securely.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// ─── Data ─────────────────────────────────────────────────────────────────

async function loadRequest(token) {
  if (!isPaymentRequestToken(token)) {
    return { view: PayViewEnum.NOT_FOUND, request: null };
  }
  const clientIp = getClientIp({ headers: await headers() });
  try {
    const { data } = await getClient().query({
      query: GET_PAYMENT_REQUEST,
      variables: { token },
      fetchPolicy: "no-cache",
      context: clientIp ? { headers: { [CLIENT_IP_HEADER]: clientIp } } : {},
    });
    const request = data?.getPaymentRequest ?? null;
    return { view: viewFromRequest(request), request };
  } catch (error) {
    return { view: viewFromError(getErrorInfo(error)), request: null };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function Page({ params, searchParams }) {
  const { token } = await params;
  const query = await searchParams;
  const { view, request } = await loadRequest(token);
  const isReturning = query?.confirm === "1" && view === PayViewEnum.READY;

  return (
    <PayClient
      token={token}
      request={request}
      initialView={isReturning ? PayViewEnum.CONFIRMING : view}
    />
  );
}
