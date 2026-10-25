import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import ProductData, { getProduct } from "./product-data";
import ProductDetailPageSkeleton from "@/components/skeletons/ProductDetailPageSkeleton";
import { htmlToPlainText } from "@/utils/sanitize-html";
import { indexableRobots, toCanonicalUrl } from "@/utils/env";

export const revalidate = 300;

const DESCRIPTION_MAX_LENGTH = 160;

// SF-4: per-product title, description, canonical and Open Graph.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const seo = product.seo || {};
  const path = `/products/${product.slug || slug}`;
  const description = (
    seo.description || htmlToPlainText(product.description)
  ).slice(0, DESCRIPTION_MAX_LENGTH);
  const image = seo.og?.image || product.assets?.[0]?.path;

  return {
    // A merchant SEO title is complete; the product name gets the template.
    title: seo.title ? { absolute: seo.title } : product.name,
    description,
    keywords: seo.keywords?.length ? seo.keywords : undefined,
    robots: indexableRobots(seo.robots || undefined),
    alternates: { canonical: seo.canonical || toCanonicalUrl(path) },
    openGraph: {
      title: seo.og?.title || seo.title || product.name,
      description: seo.og?.description || description,
      url: toCanonicalUrl(path),
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: seo.twitter?.card || "summary_large_image",
      title: seo.twitter?.title || seo.title || product.name,
      description: seo.twitter?.description || description,
      ...(seo.twitter?.image || image
        ? { images: [seo.twitter?.image || image] }
        : {}),
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  // Decided before streaming starts, so a missing product is a real 404
  // and an id link a real 308 to the slug URL (SF-14).
  const product = await getProduct(slug);
  if (!product) notFound();
  if (product.slug && product.slug !== slug) {
    permanentRedirect(`/products/${product.slug}`);
  }

  return (
    <Suspense fallback={<ProductDetailPageSkeleton />}>
      <ProductData slug={slug} />
    </Suspense>
  );
}
