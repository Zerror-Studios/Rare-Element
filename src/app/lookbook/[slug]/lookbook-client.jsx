"use client";

/**
 * One lookbook (backend PRD-027): the cover, title, subtitle and intro, the
 * featured products, then each look in its layout
 * (`components/lookbook/LookSection.jsx`). Sends `lookbook_view` once per
 * lookbook and `lookbook_hotspot_click` per opened dot; product clicks carry
 * the lookbook's `item_list_id` (PRD-027 FR-8, F10).
 */

import React, { useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";
import LookSection from "@/components/lookbook/LookSection";
import ResponsiveHeroImage from "@/components/common/ResponsiveHeroImage";
import { getProductPriceLabel, htmlParser } from "@/utils/Util";
import {
  lookbookItemListId,
  trackLookbookHotspotClick,
  trackLookbookView,
} from "@/utils/analytics-events";
import { featuredProducts, sortLooks } from "@/utils/lookbook";
import { getLookbookCover } from "@/utils/responsive-image";

// ─── View ─────────────────────────────────────────────────────────────────

const LookbookClient = ({ lookbook }) => {
  const slug = lookbook?.slug || "";
  const listName = `Lookbook: ${lookbook?.title || ""}`;
  const listId = lookbookItemListId(slug);
  const featured = featuredProducts(lookbook);
  // PRD-045 FR-7: `coverMobile` below 750 px, else the cover
  const cover = getLookbookCover(lookbook);

  useEffect(() => {
    if (slug) trackLookbookView(slug);
  }, [slug]);

  const openHotspot = (position, itemId) =>
    trackLookbookHotspotClick(slug, position, itemId);

  return (
    <div>
      {cover.desktop && (
        <div className="products_hero-section">
          <ResponsiveHeroImage
            desktop={cover.desktop}
            mobile={cover.mobile}
            alt={cover.desktop.alt || lookbook?.title || ""}
            priority
            sizes="100vw"
            className="products_hero-img"
          />
        </div>
      )}
      <div className="category_products_header">
        {lookbook?.subtitle && (
          <p className="products_subtitle thin text-base uppercase">{lookbook.subtitle}</p>
        )}
        <h1 className="products_title text-3xl">{lookbook?.title || ""}</h1>
      </div>
      {lookbook?.intro && (
        <div className="padding">
          <div className="lookbook_intro text-base">{htmlParser(lookbook.intro)}</div>
        </div>
      )}
      {featured.length > 0 && (
        <div className="padding">
          <div className="allproducts_paren lookbook_products">
            {featured.map((product) => (
              <Link
                key={product._id}
                scroll={false}
                href={`/products/${product.slug || product._id}`}
              >
                <ProductCard
                  productId={product._id}
                  name={product.name || ""}
                  price={getProductPriceLabel(product.variants)}
                  assets={product.assets || []}
                  product={product}
                  listName={listName}
                  listId={listId}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      {sortLooks(lookbook?.looks).map((look) => (
        <LookSection
          key={look._id}
          look={look}
          listName={listName}
          listId={listId}
          onHotspotOpen={openHotspot}
        />
      ))}
    </div>
  );
};

export default LookbookClient;
