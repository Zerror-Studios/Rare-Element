/**
 * Site search (PRD-014 FR-2.8, UX-28)
 *
 * `/search?q=…` searches published products by name, description and SKU
 * through `getClientSideProducts(filters.search)`. Results depend on the
 * query string, so the page is rendered per request and kept out of the
 * index (robots `noindex, follow`; `/search` is also disallowed in
 * robots.txt).
 */

import SearchClient from "./search-client";

// ─── Constants ────────────────────────────────────────────────────────────

const SEARCH_TERM_MAX_LENGTH = 100;

export const metadata = {
  title: "Search",
  description: "Search Nahara fine jewellery.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params?.q) ? params.q[0] : params?.q;
  const term = String(raw || "").trim().slice(0, SEARCH_TERM_MAX_LENGTH);

  return <SearchClient key={term} initialTerm={term} />;
}
