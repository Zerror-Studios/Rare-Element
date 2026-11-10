"use client";

/**
 * A look image with product dots (backend PRD-027 §6).
 *
 * The image keeps its own aspect ratio (tagged images are never cropped).
 * Each dot is a button labelled with the product's name; it opens a small
 * card with the price and a link to the product. Escape or a click outside
 * closes it. `media` is `pickLookMedia(...)` (no dots when `showDots` is
 * false: on a phone without a mobile image the look's strip lists them).
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/components/lookbookChapter/LookHotspotImage.jsx`.
 */

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getProductPriceLabel } from "@/utils/Util";
import { getAnalyticsItemId } from "@/utils/analytics-events";

// ─── Constants ────────────────────────────────────────────────────────────

const FALLBACK_WIDTH = 1200;
const FALLBACK_HEIGHT = 1500;

// ─── Component ────────────────────────────────────────────────────────────

const LookHotspotImage = ({ media, sizes = "100vw", onHotspotOpen }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpenIndex(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openIndex]);

  if (!media?.url) return null;
  const hotspots = media.showDots ? media.hotspots : [];

  const toggle = (index, spot) => {
    const isOpening = openIndex !== index;
    setOpenIndex(isOpening ? index : null);
    if (isOpening) onHotspotOpen?.(getAnalyticsItemId(spot.product));
  };

  return (
    <div className="lookbook_image" ref={wrapperRef}>
      <Image
        src={media.url}
        alt={media.alt}
        width={media.width || FALLBACK_WIDTH}
        height={media.height || FALLBACK_HEIGHT}
        sizes={sizes}
        className="lookbook_image_img"
      />
      {hotspots.map((spot, index) => {
        const product = spot.product;
        const name = spot.label || product.name || "";
        const isOpen = openIndex === index;
        return (
          <div
            key={`${spot.productId}-${index}`}
            className="lookbook_hotspot"
            style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
          >
            <button
              type="button"
              className="lookbook_hotspot_dot"
              aria-label={name}
              aria-expanded={isOpen}
              onClick={() => toggle(index, spot)}
            />
            {isOpen && (
              <div className="lookbook_hotspot_card" role="dialog" aria-label={name}>
                <p className="text-sm bold">{name}</p>
                <p className="text-sm">{getProductPriceLabel(product.variants)}</p>
                <Link
                  href={`/products/${product.slug || product._id}`}
                  className="text-sm uppercase underline"
                >
                  View piece
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LookHotspotImage;
