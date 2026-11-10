/**
 * /lookbook: the store's published lookbooks (backend PRD-027 FR-6.1,
 * through the kit's `getLookbooks`), each a cover, title and subtitle
 * linking to its page. Rebuilt every 5 minutes, like the catalogue pages; a
 * failed read shows the empty state until the next rebuild.
 */

import Image from "next/image";
import Link from "next/link";
import { getLookbooks } from "@zcom/storefront-kit/server";
import { STORE_REVALIDATE_SECONDS } from "@/lib/server-query";
import { indexableRobots, toCanonicalUrl } from "@/utils/env";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

// ─── Constants ────────────────────────────────────────────────────────────

export const revalidate = 300;

const LOOKBOOK_LIST_LIMIT = 50;
const TITLE = "Lookbook";
const DESCRIPTION =
  "Nahara lookbooks: our fine jewellery styled and photographed, with every piece one tap away.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: indexableRobots("index, follow"),
  alternates: { canonical: toCanonicalUrl("/lookbook") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: toCanonicalUrl("/lookbook") },
};

// ─── Data ─────────────────────────────────────────────────────────────────

async function readLookbooks() {
  try {
    const { lookbooks } = await getLookbooks(
      { limit: LOOKBOOK_LIST_LIMIT },
      { revalidate: STORE_REVALIDATE_SECONDS },
    );
    return lookbooks;
  } catch (error) {
    console.error("Lookbook list failed:", error?.message);
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function Page() {
  const lookbooks = await readLookbooks();
  return (
    <div>
      <div className="category_products_header">
        <p className="products_subtitle thin text-base uppercase">Styled by Nahara</p>
        <h1 className="products_title text-3xl">{TITLE}</h1>
      </div>
      {lookbooks.length === 0 ? (
        <div className="lookbook_empty">
          <p className="text-base">Our next lookbook is being styled. Meanwhile, discover the collection.</p>
          <div className="lookbook_cta">
            <GreenBoxBtn type="button" title="Shop all" href="/products" />
          </div>
        </div>
      ) : (
        <div className="padding lookbook_list">
          {lookbooks.map((lookbook) => (
            <Link key={lookbook._id} href={`/lookbook/${lookbook.slug}`} className="lookbook_list_item">
              <div className="lookbook_list_cover">
                {lookbook.cover?.url && (
                  <Image
                    src={lookbook.cover.url}
                    alt={lookbook.cover.alt || lookbook.title || ""}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
                  />
                )}
              </div>
              {lookbook.subtitle && (
                <p className="thin text-sm uppercase">{lookbook.subtitle}</p>
              )}
              <h2 className="text-xl">{lookbook.title}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
