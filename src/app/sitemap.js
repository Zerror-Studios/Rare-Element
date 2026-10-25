/**
 * sitemap.xml (PRD-014 FR-2.8, UX-33)
 *
 * The public pages, every storefront category and the published products,
 * read from the catalog with the anonymous server client. Capped at
 * `SITEMAP_PRODUCT_LIMIT` products (pages of `SITEMAP_PAGE_SIZE`, the
 * backend's page cap) so one request never walks an unbounded catalog. A
 * catalog failure still serves the static pages; the next revalidation
 * fills the rest in.
 */

import { GET_CLIENT_SIDE_CATEGORIES, GET_SITEMAP_PRODUCTS } from "@/graphql";
import { getClient } from "@/lib/apollo-client-rsc";
import { ProductStatus } from "@/utils/Constant";
import { SITE_URL_CONFIGURED, toCanonicalUrl } from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

export const revalidate = 3600;

const SITEMAP_PAGE_SIZE = 100;
const SITEMAP_PRODUCT_LIMIT = 1000;
const SITEMAP_CATEGORY_LIMIT = 100;

const STATIC_PATHS = [
  { path: "/", priority: 1 },
  { path: "/products", priority: 0.9 },
  { path: "/contact", priority: 0.5 },
  { path: "/shipping-returns", priority: 0.3 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms-of-service", priority: 0.3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Each segment encoded; a nested category slug keeps its `/` (W2V-C-05). */
const toCategoryPath = (slug) =>
  String(slug).split("/").map(encodeURIComponent).join("/");

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
};

async function fetchProductEntries(client) {
  const entries = [];
  for (
    let offset = 0;
    offset < SITEMAP_PRODUCT_LIMIT;
    offset += SITEMAP_PAGE_SIZE
  ) {
    const { data } = await client.query({
      query: GET_SITEMAP_PRODUCTS,
      variables: {
        offset,
        limit: SITEMAP_PAGE_SIZE,
        filters: { status: ProductStatus.PUBLISHED },
      },
    });
    const page = data?.getClientSideProducts;
    const products = page?.products || [];
    products
      .filter((product) => product?.slug)
      .forEach((product) =>
        entries.push({
          url: toCanonicalUrl(`/products/${encodeURIComponent(product.slug)}`),
          lastModified: toDate(product.updatedAt),
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      );
    if (
      products.length < SITEMAP_PAGE_SIZE ||
      offset + SITEMAP_PAGE_SIZE >= (page?.totalCount || 0)
    ) {
      break;
    }
  }
  return entries;
}

async function fetchCategoryEntries(client) {
  const { data } = await client.query({
    query: GET_CLIENT_SIDE_CATEGORIES,
    variables: {
      offset: 0,
      limit: SITEMAP_CATEGORY_LIMIT,
      filter: { isSpecialCategory: false },
    },
  });
  return (data?.getClientSideCategories?.categories || [])
    .filter((category) => category?.slug)
    .map((category) => ({
      url: toCanonicalUrl(`/${toCategoryPath(category.slug)}`),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
}

// ─── Route ────────────────────────────────────────────────────────────────

export default async function sitemap() {
  // No configured origin (W2V-C-04): list nothing rather than another site.
  if (!SITE_URL_CONFIGURED) return [];
  const staticEntries = STATIC_PATHS.map(({ path, priority }) => ({
    url: toCanonicalUrl(path),
    changeFrequency: "weekly",
    priority,
  }));

  let client = null;
  try {
    client = getClient();
  } catch {
    // No gateway configured (e.g. a build without env): static pages only.
    return staticEntries;
  }
  const [categories, products] = await Promise.allSettled([
    fetchCategoryEntries(client),
    fetchProductEntries(client),
  ]);
  return [
    ...staticEntries,
    ...(categories.status === "fulfilled" ? categories.value : []),
    ...(products.status === "fulfilled" ? products.value : []),
  ];
}
