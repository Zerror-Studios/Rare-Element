"use client";

/**
 * Checkout URL (PRD-034 FR-1.9)
 *
 * Adds the link's lines to the shopper's bag through the existing cart
 * operations (signed-in customer, or the server-issued guest id), then
 * opens checkout; a guest goes through login first, where the guest bag
 * is merged (as the bag drawer does). Variant ids are mapped to their
 * products with `getVariantAvailability` (published products only). Bad
 * input or nothing addable shows a message with a link to the shop.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import {
  ADD_ITEM_TO_CART,
  CART_LIST,
  GET_VARIANT_AVAILABILITY,
} from "@/graphql";
import { useVisitor } from "@/hooks/useVisitor";
import { useAuthStore } from "@/store/auth-store";
import {
  getCheckoutStartMessage,
  parseCheckoutStartProducts,
} from "@/utils/checkout-start";

// ─── Component ────────────────────────────────────────────────────────────

const CheckoutStartClient = ({ products }) => {
  const router = useRouter();
  const client = useApolloClient();
  const { isLoggedIn } = useAuthStore((state) => state);
  const { runWithGuestId } = useVisitor();
  const [addItemToCart] = useMutation(ADD_ITEM_TO_CART);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const parsed = parseCheckoutStartProducts(products);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    const addLine = (input) =>
      isLoggedIn
        ? addItemToCart({ variables: { input } })
        : runWithGuestId((guestId) =>
            addItemToCart({ variables: { input, guestId } }),
          );

    const run = async () => {
      const { data } = await client.query({
        query: GET_VARIANT_AVAILABILITY,
        variables: { variantIds: parsed.lines.map((line) => line.variantId) },
        fetchPolicy: "network-only",
      });
      const productOf = new Map(
        (data?.getVariantAvailability || []).map((row) => [
          String(row.variantId),
          row,
        ]),
      );
      const addable = parsed.lines.filter((line) =>
        productOf.has(line.variantId),
      );
      if (!addable.length) return "UNAVAILABLE";

      let added = 0;
      // One at a time: each add re-prices the same bag on the server.
      for (const line of addable) {
        const row = productOf.get(line.variantId);
        // A simple product's id stands for its only "variant".
        const variantId =
          String(row.variantId) === String(row.productId)
            ? undefined
            : line.variantId;
        try {
          await addLine({ productId: row.productId, variantId, qty: line.qty });
          added += 1;
        } catch {
          // Unavailable line: the others still go in the bag.
        }
      }
      if (!added) return "ADD_FAILED";

      const { data: cartResponse } = await (isLoggedIn
        ? client.query({ query: CART_LIST, fetchPolicy: "network-only" })
        : runWithGuestId((guestId) =>
            client.query({
              query: CART_LIST,
              variables: { guestId },
              fetchPolicy: "network-only",
            }),
          ));
      const cartId = cartResponse?.getCart?._id;
      if (!cartId) return "ADD_FAILED";

      const checkoutPath = `/checkout/${encodeURIComponent(cartId)}`;
      // Checkout is customer-only; login merges the guest bag.
      router.replace(
        isLoggedIn
          ? checkoutPath
          : `/login?next=${encodeURIComponent(checkoutPath)}`,
      );
      return null;
    };

    run()
      .then((failure) => {
        if (failure) setError(failure);
      })
      .catch(() => setError("ADD_FAILED"));
  }, [products, isLoggedIn, client, addItemToCart, runWithGuestId, router]);

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
