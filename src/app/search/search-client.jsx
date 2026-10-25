"use client";

/**
 * Site search results (PRD-014 FR-2.8, UX-28)
 *
 * Submitting the form navigates to `/search?q=…` (shareable, back button
 * works); the page remounts this component per term. Results come from
 * `getClientSideProducts` with `filters.search`, a page at a time with
 * "Load more". The `search` event is sent once per term with the total.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { RiSearchLine } from "@remixicon/react";

import ProductCard from "@/components/common/ProductCard";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { GET_PRODUCTS } from "@/graphql";
import { trackSearch } from "@/utils/analytics-events";
import { ProductStatus } from "@/utils/Constant";
import { getErrorMessage } from "@/utils/errors";
import { getProductPriceLabel } from "@/utils/Util";

// ─── Constants ────────────────────────────────────────────────────────────

const SEARCH_PAGE_SIZE = 20;
const SEARCH_TERM_MIN_LENGTH = 2;
const SEARCH_TERM_MAX_LENGTH = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────

const appendUnique = (current, next) => {
  const seen = new Set(current.map((product) => product?._id));
  return [
    ...current,
    ...(next || []).filter((product) => !seen.has(product?._id)),
  ];
};

// ─── Component ────────────────────────────────────────────────────────────

const SearchClient = ({ initialTerm = "" }) => {
  const router = useRouter();
  const client = useApolloClient();
  const inputRef = useRef(null);
  const trackedRef = useRef(false);
  const [input, setInput] = useState(initialTerm);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = initialTerm.length >= SEARCH_TERM_MIN_LENGTH;
  const hasMore = products.length < totalCount;

  const loadPage = async (offset) => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await client.query({
        query: GET_PRODUCTS,
        variables: {
          offset,
          limit: SEARCH_PAGE_SIZE,
          filters: { status: ProductStatus.PUBLISHED, search: initialTerm },
        },
        fetchPolicy: "network-only",
      });
      const page = data?.getClientSideProducts;
      const total = page?.totalCount || 0;
      setProducts((current) =>
        offset === 0
          ? page?.products || []
          : appendUnique(current, page?.products),
      );
      setTotalCount(total);
      if (!trackedRef.current) {
        trackedRef.current = true;
        trackSearch(initialTerm, total);
      }
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't search right now."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canSearch) loadPage(0);
    else inputRef.current?.focus();
    // One search per mounted term: the page remounts this on a new `q`.
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const term = input.trim().slice(0, SEARCH_TERM_MAX_LENGTH);
    if (term.length < SEARCH_TERM_MIN_LENGTH) {
      setError(`Type at least ${SEARCH_TERM_MIN_LENGTH} characters.`);
      inputRef.current?.focus();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <div className="products_header">
        <p className="products_subtitle thin text-base uppercase">Search</p>
        <h1 className="products_title text-3xl">
          {canSearch ? `Results for “${initialTerm}”` : "Find your piece"}
        </h1>
      </div>

      <form
        role="search"
        className="search_form padding"
        onSubmit={handleSubmit}
      >
        <label htmlFor="site_search_input" className="search_label text-sm">
          Search products
        </label>
        <div className="search_field">
          <input
            ref={inputRef}
            id="site_search_input"
            type="search"
            name="q"
            value={input}
            maxLength={SEARCH_TERM_MAX_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            className="checkOut_input search_input"
            placeholder="Rings, earrings, gold…"
            autoComplete="off"
          />
          <button type="submit" className="search_submit" aria-label="Search">
            <RiSearchLine size={20} aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="search_results padding" aria-live="polite">
        {error && (
          <p className="search_message text-base" role="alert">
            {error}
          </p>
        )}
        {canSearch && !error && !isLoading && products.length === 0 && (
          <div className="search_message">
            <h2 className="text-xl">No products match “{initialTerm}”</h2>
            <Link href="/products" className="text_decoration_underline">
              Browse all products
            </Link>
          </div>
        )}
        {products.length > 0 && (
          <p className="search_count text-sm uppercase">
            Showing {products.length} of {totalCount}
          </p>
        )}
        <div className={`allproducts_paren ${isLoading ? "opacity-50" : ""}`}>
          {products.map((item) => (
            <Link
              prefetch
              key={item?._id}
              scroll={false}
              title={item?.name || ""}
              href={`/products/${item?.slug || item?._id}`}
            >
              <ProductCard
                productId={item?._id}
                name={item?.name || ""}
                price={getProductPriceLabel(item?.variants)}
                assets={item?.assets || []}
                product={item}
                listName="Search results"
              />
            </Link>
          ))}
        </div>
        {isLoading && products.length === 0 && (
          <p className="search_message text-base">Searching…</p>
        )}
        {hasMore && (
          <div className="load_more_container">
            <GreenBoxBtn
              type="button"
              title="Load More"
              onClick={() => loadPage(products.length)}
              loading={isLoading}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default SearchClient;
