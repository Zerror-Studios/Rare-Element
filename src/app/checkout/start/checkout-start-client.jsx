"use client";

/**
 * Checkout URL (PRD-034 FR-1.9)
 *
 * The kit's `useCheckoutStart` (PRD-002 FR-4.1) adds the link's lines to
 * the shopper's bag (signed-in customer, or the server-issued guest id),
 * once per link and tab, skipping archived or sold-out variants. Then this
 * opens the cart's checkout; a guest goes through login first, where the
 * guest bag is merged (as the bag drawer does). Bad input or nothing
 * addable shows a message with a link to the shop.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { useCheckoutStart } from "@zcom/storefront-kit/client";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { CART_LIST } from "@/graphql";
import { useVisitor } from "@/hooks/useVisitor";
import { useAuthStore } from "@/store/auth-store";
import { getCheckoutStartMessage } from "@/utils/checkout-start";

// ─── Component ────────────────────────────────────────────────────────────

const CheckoutStartClient = ({ products }) => {
  const router = useRouter();
  const client = useApolloClient();
  const { isLoggedIn } = useAuthStore((state) => state);
  const { runWithGuestId } = useVisitor();
  // The kit adds the link's items to the bag once per link and tab
  const state = useCheckoutStart(products ?? null);
  const [openError, setOpenError] = useState(null);
  const error = state.status === "error" ? state.errorKey : openError;

  useEffect(() => {
    if (state.status !== "ready") return;
    const readCart = () =>
      isLoggedIn
        ? client.query({ query: CART_LIST, fetchPolicy: "network-only" })
        : runWithGuestId((guestId) =>
            client.query({
              query: CART_LIST,
              variables: { guestId },
              fetchPolicy: "network-only",
            }),
          );
    readCart()
      .then(({ data }) => {
        const cartId = data?.getCart?._id;
        if (!cartId) {
          setOpenError("ADD_FAILED");
          return;
        }
        const checkoutPath = `/checkout/${encodeURIComponent(cartId)}`;
        // Checkout is customer-only; login merges the guest bag.
        router.replace(
          isLoggedIn
            ? checkoutPath
            : `/login?next=${encodeURIComponent(checkoutPath)}`,
        );
      })
      .catch(() => setOpenError("ADD_FAILED"));
  }, [state.status, isLoggedIn, client, runWithGuestId, router]);

  if (!error) {
    return (
      <div className="status_section center" role="status" aria-live="polite">
        <div className="status_section_inner">
          <h1 className="text-3xl font-bold">Preparing your bag</h1>
          <p className="uppercase mt-2">Adding your items, one moment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl font-bold">We couldn&apos;t open checkout</h1>
        <p className="uppercase mt-2">{getCheckoutStartMessage(error)}</p>
        <p className="mt-4">
          Browse the shop instead:{" "}
          <Link className="underline" href="/products">
            all products
          </Link>
        </p>
        <div className="w-full mt-8 flex flex-col payment_failed_actions">
          <GreenBoxBtn type="button" title="Continue Shopping" href="/products" />
        </div>
      </div>
    </div>
  );
};

export default CheckoutStartClient;
