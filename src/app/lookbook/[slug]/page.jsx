/**
 * /lookbook/[slug]: one published lookbook (backend PRD-027 FR-6.2, through
 * the kit's `getLookbook`). An unknown or hidden slug is a real 404 and an
 * old slug (`previousSlugs`) a real 301: they are decided before anything
 * renders, and no `loading.jsx` sits above this route (SF-14). Rebuilt
 * every 5 minutes, like the catalogue pages.
 */

import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getLookbook } from "@zcom/storefront-kit/server";
import { STORE_REVALIDATE_SECONDS } from "@/lib/server-query";
import { htmlToPlainText } from "@/utils/sanitize-html";
import { indexableRobots, toCanonicalUrl } from "@/utils/env";
import LookbookClient from "./lookbook-client";

// ─── Constants ────────────────────────────────────────────────────────────

export const revalidate = 300;

const DESCRIPTION_MAX_LENGTH = 160;

// ─── Data ─────────────────────────────────────────────────────────────────

// One read for the metadata and the page.
const readLookbook = cache(
  async (slug) =>
    await getLookbook(slug, { revalidate: STORE_REVALIDATE_SECONDS }),
);

// ─── Metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { lookbook, redirectTo } = await readLookbook(slug);
  if (!lookbook || redirectTo) return { title: "Lookbook not found" };

  const seo = lookbook.seo || {};
  const path = `/lookbook/${lookbook.slug}`;
  const description = (
    seo.description ||
    lookbook.subtitle ||
    htmlToPlainText(lookbook.intro)
  ).slice(0, DESCRIPTION_MAX_LENGTH);
  const image = seo.ogImageUrl || lookbook.cover?.url;

  return {
    // A merchant SEO title is complete; the lookbook title gets the template.
    title: seo.title ? { absolute: seo.title } : lookbook.title,
    description,
    robots: indexableRobots("index, follow"),
    alternates: { canonical: toCanonicalUrl(path) },
    openGraph: {
      title: seo.title || lookbook.title,
      description,
      url: toCanonicalUrl(path),
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function Page({ params }) {
  const { slug } = await params;
  const { lookbook, redirectTo } = await readLookbook(slug);
  if (redirectTo) permanentRedirect(`/lookbook/${redirectTo}`);
  if (!lookbook) notFound();
  return <LookbookClient lookbook={lookbook} />;
}
