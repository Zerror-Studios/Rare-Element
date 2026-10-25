"use client";

/**
 * The listing's sort, kept in `?sort=` (PRD-014 Wave 2, W2-STORE)
 *
 * The listing pages are statically rendered (ISR) in the default order, so
 * the query is read after mount (no `useSearchParams`, which would turn
 * the server-rendered list into a client-only one). `onSortFromUrl` runs
 * once when the URL asks for another order; `changeSort` writes the URL
 * with `history.replaceState` (Next keeps its router in step) and returns
 * the new value for the caller's first-page refetch.
 */

import { useEffect, useState } from "react";

import {
  DEFAULT_LISTING_SORT,
  parseListingSort,
  toSortQueryValue,
} from "@/utils/listing-sort";

// ─── Helpers ──────────────────────────────────────────────────────────────

const writeSortToUrl = (sort) => {
  const url = new URL(window.location.href);
  const value = toSortQueryValue(sort);
  if (value) url.searchParams.set("sort", value);
  else url.searchParams.delete("sort");
  window.history.replaceState(window.history.state, "", url);
};

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useListingSort(onSortFromUrl) {
  const [sort, setSort] = useState(DEFAULT_LISTING_SORT);

  useEffect(() => {
    const fromUrl = parseListingSort(
      new URLSearchParams(window.location.search).get("sort"),
    );
    if (fromUrl === DEFAULT_LISTING_SORT) return;
    setSort(fromUrl);
    onSortFromUrl(fromUrl);
  }, []);

  const changeSort = (value) => {
    const next = parseListingSort(value);
    setSort(next);
    writeSortToUrl(next);
    return next;
  };

  return { sort, changeSort };
}
