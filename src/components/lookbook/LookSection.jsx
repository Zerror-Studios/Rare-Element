"use client";

/**
 * One look of a backend lookbook (backend PRD-027 FR-2, §6), in Nahara's
 * listing style (white ground, the shop grid, `text-*` type classes).
 *
 * Layouts: FULL_BLEED (one wide image), SPLIT (image beside the text, or two
 * images), GRID (up to four images), TEXT (heading and copy only), VIDEO
 * (one muted, looping video with a play/pause control). Every layout ends
 * with the look's products (`lookProducts`) and its CTA when the link is
 * safe. Below 768 px the mobile rules of `utils/lookbook.js` apply.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/components/lookbookChapter/LookSection.jsx`.
 */

import React, { useEffect, useRef, useState } from "react";
import LookHotspotImage from "./LookHotspotImage";
import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { getProductPriceLabel, htmlParser } from "@/utils/Util";
import {
  LOOKBOOK_MOBILE_MAX_WIDTH_PX,
  LookLayoutEnum,
  lookProducts,
  pickLookMedia,
  toSafeCtaHref,
} from "@/utils/lookbook";

// ─── Constants ────────────────────────────────────────────────────────────

const MOBILE_QUERY = `(max-width: ${LOOKBOOK_MOBILE_MAX_WIDTH_PX}px)`;
const GRID_MAX_MEDIA = 4;

// ─── Hooks ────────────────────────────────────────────────────────────────

/** True below 768 px (false on the server and the first client render). */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isMobile;
};

// ─── Parts ────────────────────────────────────────────────────────────────

const LookText = ({ look }) =>
  look.heading || look.body ? (
    <div className="lookbook_look_text">
      {look.heading && <h2 className="text-2xl">{look.heading}</h2>}
      {look.body && <div className="text-base lookbook_look_body">{htmlParser(look.body)}</div>}
    </div>
  ) : null;

const LookVideo = ({ media }) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  if (!media?.url) return null;

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <div className="lookbook_video">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={media.posterUrl || undefined}
        src={media.url}
      />
      <button type="button" className="lookbook_video_toggle text-sm uppercase" onClick={toggle}>
        {isPaused ? "Play" : "Pause"}
      </button>
    </div>
  );
};

const LookProducts = ({ products, listName, listId }) =>
  products.length > 0 ? (
    <div className="padding">
      <p className="thin text-base uppercase lookbook_shop_title">Shop this look</p>
      <div className="allproducts_paren lookbook_products">
        {products.map((product) => (
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
  ) : null;

// ─── Component ────────────────────────────────────────────────────────────

const LookSection = ({ look, listName, listId, onHotspotOpen }) => {
  const isMobile = useIsMobile();
  const media = (look?.media || [])
    .map((item) => pickLookMedia(item, isMobile))
    .filter(Boolean);
  const products = lookProducts(look);
  const ctaHref = toSafeCtaHref(look?.cta?.href);
  const openHotspot = (itemId) => onHotspotOpen?.(look.position, itemId);

  const image = (item, sizes) => (
    <LookHotspotImage
      key={item.url}
      media={item}
      sizes={sizes}
      onHotspotOpen={openHotspot}
    />
  );

  let body;
  switch (look?.layout) {
    case LookLayoutEnum.TEXT:
      body = <LookText look={look} />;
      break;
    case LookLayoutEnum.VIDEO:
      body = (
        <>
          <LookText look={look} />
          <LookVideo media={media[0]} />
        </>
      );
      break;
    case LookLayoutEnum.SPLIT:
      body = (
        <div className="padding lookbook_split">
          {media.slice(0, 2).map((item) => image(item, "(max-width: 767px) 100vw, 50vw"))}
          {media.length < 2 && <LookText look={look} />}
        </div>
      );
      break;
    case LookLayoutEnum.GRID:
      body = (
        <>
          <LookText look={look} />
          <div className="padding lookbook_grid">
            {media.slice(0, GRID_MAX_MEDIA).map((item) => image(item, "(max-width: 767px) 100vw, 50vw"))}
          </div>
        </>
      );
      break;
    default:
      // FULL_BLEED (and any layout added later)
      body = (
        <>
          <div className="lookbook_full">{media[0] && image(media[0], "100vw")}</div>
          <LookText look={look} />
        </>
      );
  }

  // SPLIT with two images puts its copy under them
  const showTextAfter = look?.layout === LookLayoutEnum.SPLIT && media.length >= 2;

  return (
    <section className="lookbook_look" aria-label={look?.heading || undefined}>
      {body}
      {showTextAfter && <LookText look={look} />}
      <LookProducts products={products} listName={listName} listId={listId} />
      {ctaHref && look.cta?.label && (
        <div className="lookbook_cta">
          <GreenBoxBtn type="button" title={look.cta.label} href={ctaHref} />
        </div>
      )}
    </section>
  );
};

export default LookSection;
