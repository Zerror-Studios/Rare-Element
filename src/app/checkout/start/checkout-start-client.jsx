"use client";

/**
 * Checkout URL (PRD-034 FR-1.9)
 *
 * The kit's `useCheckoutStart` (PRD-002 FR-4.1) adds the link's lines to
 * the shopper's bag (signed-in customer, or the server-issued guest id),
 * once per link and tab, skipping archived or sold-out variants. Then this
 * opens the cart's checkout: a guest's own bag while the store's accounts
 * are OPTIONAL (backend PRD-041 FR-17); with REQUIRED accounts a guest
 * goes through login first, where the guest bag is merged (as the bag
 * drawer does). Bad input or nothing addable shows a message with a link
 * to the shop.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import {
  useCheckoutStart,
  useStoreCheckoutOptions,
} from "@zcom/storefront-kit/client";
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
  const { allowsGuest, loading: optionsLoading } = useStoreCheckoutOptions();
  // The kit adds the link's items to the bag once per link and tab
  const state = useCheckoutStart(products ?? null);
  const [openError, setOpenError] = useState(null);
  // Checkout opens once, whatever re-renders after the bag is ready
  const openedRef = useRef(false);
  const error = state.status === "error" ? state.errorKey : openError;

  useEffect(() => {
    if (state.status !== "ready") return;
    if (openedRef.current) return;
    if (!isLoggedIn && optionsLoading) return;
    openedRef.current = true;
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
        const checkoutPath = "/checkout";
        // PRD-041: a guest's own bag unless accounts are REQUIRED (then
        // login, which merges the guest bag).
        router.replace(
          isLoggedIn || allowsGuest
            ? checkoutPath
            : `/login?next=${encodeURIComponent(checkoutPath)}`,
        );
      })
      .catch(() => setOpenError("ADD_FAILED"));
  }, [
    state.status,
    isLoggedIn,
    allowsGuest,
    optionsLoading,
    client,
    runWithGuestId,
    router,
  ]);

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
