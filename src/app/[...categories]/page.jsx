import { cache } from 'react'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { serverQuery } from '@/lib/server-query'
import CategoryClient from './category-client'
import { notFound } from 'next/navigation'
import { isNotFoundError } from '@/utils/errors'
import { indexableRobots, toCanonicalUrl } from '@/utils/env'

export const revalidate = 300;

// No page is built ahead: each is rendered on its first visit, then cached
// and rebuilt every `revalidate` seconds (ISR). Without this export a
// dynamic segment is rendered on every request and sent as no-store, so
// the CDN can't cache it.
export async function generateStaticParams() {
  return [];
}

const PAGE_SIZE = 12;

const defaultMeta = {
  title: "Shop by Category – Fine Jewellery by Nahara",
  description: "Browse jewellery categories including rings, earrings, necklaces, bracelets, and anklets crafted with gold, diamonds, and silver.",
  keywords: [
    "jewellery categories",
    "rings earrings necklaces",
    "Nahara jewellery"
  ],
  robots: "index, follow",
};

/**
 * The category for a slug, or null when it doesn't exist. Other failures
 * throw to the error boundary, so a backend blip is never cached as a 404
 * (SF-14). Shared by generateMetadata and the page within a request.
 */
const getCategory = cache(async (slug) => {
  try {
    const response = await serverQuery(GET_CLIENT_SIDE_CATEGORY_BY_SLUG, {
      slug,
      limit: PAGE_SIZE,
      offset: 0,
    });
    return response?.getClientSideCategory || null;
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
});

export async function generateMetadata({ params }) {
  const { categories } = await params;
  const slug = categories[categories.length - 1];
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };

  const seo = category.seo || {};
  const path = `/${categories.join("/")}`;

  return {
    // A merchant SEO title is complete; the category name gets the template.
    title: seo.title ? { absolute: seo.title } : category.name || defaultMeta.title,
    description: seo.description || category.description || defaultMeta.description,
    keywords: seo.keywords?.length ? seo.keywords : defaultMeta.keywords,
    robots: indexableRobots(seo.robots || defaultMeta.robots),
    alternates: { canonical: seo.canonical || toCanonicalUrl(path) },
  };
}

// No `loading.jsx` in this route (removed 2026-11-11): a loading boundary
// makes the page stream, and a missing category then answered 200 instead of
// 404 (SF-14, found by the kit's live check). The category is read before
// anything renders, as the product page does.
export default async function Page({ params }) {
  const { categories } = await params;
  const slug = categories[categories.length - 1];
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const { _id, name, description, imgsrc, slug: categoriesSlug, seo, products, productsCount } = category;

  return (
    <CategoryClient
      // A new category starts with its own sort and list (W2-STORE).
      key={slug}
      meta={seo || defaultMeta}
      data={{ _id, name, description, imgsrc, categoriesSlug }}
      initialProducts={products || []}
      initialTotalCount={productsCount || 0}
    />
  );
}
