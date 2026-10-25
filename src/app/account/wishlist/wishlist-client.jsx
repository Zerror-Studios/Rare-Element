"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useApolloClient } from '@apollo/client/react';
import { GET_PRODUCTS_BY_IDS } from '@/graphql';
import { useAuthStore } from '@/store/auth-store';
import { useWishlist } from '@/hooks/useWishlist';
import { getProductPriceLabel } from '@/utils/Util';
import { getErrorMessage } from '@/utils/errors';

// PRD-014 FE-22: the server's per-call cap of `getClientSideProductsByIds`.
const MAX_PRODUCTS_BY_IDS = 50;

const toChunks = (values, size) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

// PRD-014 FE-22: the wishlist stores product ids; their products load in
// one call per 50 (was one query per card). Only published products come
// back, so a retired product simply disappears. W2V-C-02: each chunk
// settles on its own, so a failed chunk shows an error next to the items
// that did load instead of hiding the whole list.
const useWishlistProducts = (productIds) => {
  const client = useApolloClient();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const idsKey = productIds.join(",");

  useEffect(() => {
    if (!productIds.length) {
      // W2V2-05: the cleanup above dropped any load still in flight, so
      // clear its spinner too (removing the last item mid-load).
      setProducts([]);
      setError("");
      setIsLoading(false);
      return;
    }
    let isCancelled = false;
    setIsLoading(true);
    setError("");
    Promise.allSettled(
      toChunks(productIds, MAX_PRODUCTS_BY_IDS).map((ids) =>
        client.query({
          query: GET_PRODUCTS_BY_IDS,
          variables: { ids },
          fetchPolicy: attempt > 0 ? "network-only" : "cache-first",
        }),
      ),
    ).then((results) => {
      if (isCancelled) return;
      const loaded = results
        .filter((result) => result.status === "fulfilled")
        .flatMap(
          (result) => result.value?.data?.getClientSideProductsByIds || [],
        );
      const failure = results.find((result) => result.status === "rejected");
      setProducts(loaded);
      if (failure) {
        setError(
          loaded.length
            ? "Some items in your wishlist couldn't be loaded."
            : getErrorMessage(failure.reason, "We couldn't load your wishlist."),
        );
      }
      setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, [client, idsKey, attempt]);

  const retry = () => setAttempt((value) => value + 1);

  return { products, isLoading, error, retry };
};

const WishlistClient = () => {
  const { isLoggedIn } = useAuthStore();
  const { items: wishlistItems, loading } = useWishlist();
  const productIds = Array.from(
    new Set(wishlistItems.map((item) => item?.productId).filter(Boolean)),
  );
  const { products, isLoading, error, retry } =
    useWishlistProducts(productIds);
  const isBusy = loading || isLoading;
  // Saved items whose products are all retired (or unpublished) load as
  // nothing: say so rather than render a blank page (W2V-C-02).
  const hasNoAvailableItems =
    !isBusy && !error && wishlistItems.length > 0 && products.length === 0;

  if (!isLoggedIn) {
    return (
      <div className="settings__content">
        <p>Please login to view your wishlist.</p>
      </div>
    );
  }

  return (
    <>
      <AccountBreadcrumb title={"Wishlist"} />
      <div className="settings__content">
        <h1 className="settings__title text-xl">My Wishlist</h1>
        <div className="wishlist_empty_box">
          {isBusy && <p>Loading wishlist...</p>}
          {error && !isBusy && (
            <p role="alert">
              {error}{" "}
              <button
                type="button"
                onClick={retry}
                className="text_decoration_underline"
              >
                Try again
              </button>
            </p>
          )}
          {hasNoAvailableItems && (
            <div className="wishlist_empty_box_inner">
              <p className="text-xl ">
                The items you saved are no longer available.
              </p>
              <Link href="/products" className="text_decoration_underline">
                Go to Shopping
              </Link>
            </div>
          )}
          {!loading && wishlistItems.length === 0 && (
            <div className="wishlist_empty_box_inner">
              <p className="text-xl ">Your wishlist is empty.</p>
              <Link href="/products" className="text_decoration_underline">
                Go to Shopping
              </Link>
            </div>
          )}
        </div>
        {products.length > 0 && (
          <div className="wishlist_box">
            {products.map((product) => (
              <Link key={product._id} scroll={false} href={`/products/${product.slug || product._id}`} className='wishlist_card'>
                <ProductCard
                  productId={product._id}
                  name={product.name}
                  price={getProductPriceLabel(product.variants)}
                  assets={product.assets}
                  product={product}
                  listName="Wishlist"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistClient;
