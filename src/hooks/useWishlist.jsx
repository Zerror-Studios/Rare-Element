"use client";

/**
 * Wishlist state for the logged-in customer (PRD-002 SF-1)
 *
 * One `getWishlist` query shared by every card (Apollo dedupes it) and the
 * `toggleWishlist` mutation, which adds a missing product or removes a
 * present one. Guests are sent to the login page.
 */

import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { GET_WISHLIST, TOGGLE_WISHLIST } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/utils/errors";

export const useWishlist = () => {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { data, loading } = useQuery(GET_WISHLIST, { skip: !isLoggedIn });
  const [toggleMutation, { loading: toggling }] = useMutation(TOGGLE_WISHLIST, {
    refetchQueries: [{ query: GET_WISHLIST }],
    awaitRefetchQueries: true,
  });

  const items = isLoggedIn ? data?.getWishlist || [] : [];

  const isWishlisted = (productId) =>
    !!productId && items.some((item) => item?.productId === productId);

  /** Toggle; resolves to `true` (added), `false` (removed) or null. */
  const toggle = async (productId, variantId, { silent = false } = {}) => {
    if (!isLoggedIn) {
      toast.info("Please login to add to wishlist");
      router.push("/login");
      return null;
    }
    try {
      const { data: result } = await toggleMutation({
        variables: { productId, ...(variantId ? { variantId } : {}) },
      });
      const added = !!result?.toggleWishlist?.added;
      if (!silent) {
        toast.success(added ? "Added to wishlist" : "Removed from wishlist");
      }
      return added;
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update your wishlist"));
      return null;
    }
  };

  return { items, loading, toggling, isWishlisted, toggle };
};
