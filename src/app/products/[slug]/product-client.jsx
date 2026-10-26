"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { toast } from 'react-toastify';
import { useVisitor } from "@/hooks/useVisitor";
import { useMutation } from '@apollo/client/react';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { ADD_ITEM_TO_CART, REQUEST_BACK_IN_STOCK } from "@/graphql";
import SeoHeader from "@/components/seo/SeoHeader";
import ProductImageGrid from '@/components/product/ProductImageGrid';
import ProductContant from '@/components/product/ProductContant';
import ProductListGrid from "@/components/product/ProductListGrid";
import ProductReviews from "@/components/product/ProductReviews";
import { trackEcomEvent } from "@/utils/analytics";
import { getAnalyticsItemId, trackNotifyMe } from "@/utils/analytics-events";
import * as fpixel from "@/lib/fpixel";
import { getMinVariantPrice } from "@/utils/Util";
import { getErrorInfo, getErrorMessage } from "@/utils/errors";
import { getNotifyMeSuccessMessage } from "@/utils/back-in-stock";
import { useVariantAvailability } from "@/hooks/useVariantAvailability";
import {
  getStockNote,
  isSoldOut,
  resolveVariantSignal,
} from "@/utils/stock-signal";

// A guest's "Notify me" needs an email (PRD-020 FR-12); the server checks it.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProductClient({ meta, data, productList, slug, reviews = [], reviewCount = 0 }) {
  const breadcrumbList = [
    { name: data?.categories?.[0]?.name || "Products", slug: data?.categories?.[0]?.slug ? `/${data.categories[0].slug}` : "/products" },
    { name: data?.name, slug: `/products/${data?.slug}` }
  ];

  const { runWithGuestId } = useVisitor();
  // Prices come from the (published) variants; the server prices the cart.
  const basePrice = useMemo(() => getMinVariantPrice(data?.variants), [data]);
  // A product without options sells its single variant directly.
  const defaultVariant =
    !data?.productOptions?.length && data?.variants?.length === 1
      ? data.variants[0]
      : null;
  const [assetsFilter, setAssetsFilter] = useState([])
  const [finalPrice, setFinalPrice] = useState(defaultVariant?.price || basePrice);
  const [variantMatched, setVariantMatched] = useState(defaultVariant);
  const [cartBtn, setCartBtn] = useState(!!defaultVariant);
  // Storefronts get no stock levels; an option combination without a
  // published variant, or a PRODUCT_UNAVAILABLE answer, is "unavailable".
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const { user, isLoggedIn } = useAuthStore((state) => state);
  const { openCart } = useCartStore((state) => state);

  const [addItemToCart, { loading }] = useMutation(ADD_ITEM_TO_CART);
  const [createNotifyRequest, { loading: notifyLoading }] = useMutation(REQUEST_BACK_IN_STOCK);

  useEffect(() => {
    setIsUnavailable(false);
  }, [variantMatched, slug]);

  // PRD-020 FR-12: the stock signal (null = today's behaviour). The ISR
  // value shows first; the fresh read on mount and on variant change
  // overrides it, and a failed read keeps it.
  const variantIds = useMemo(
    () => (data?.variants || []).map((variant) => variant?._id),
    [data],
  );
  const { fresh: freshStock, refresh: refreshStock } = useVariantAvailability(
    variantIds,
    { skip: !data?._id },
  );
  // Re-read on a variant change (the mount read already covers the first).
  const lastVariantIdRef = useRef(variantMatched?._id || null);
  useEffect(() => {
    const variantId = variantMatched?._id || null;
    if (variantId && lastVariantIdRef.current && variantId !== lastVariantIdRef.current) {
      refreshStock();
    }
    if (variantId) lastVariantIdRef.current = variantId;
  }, [variantMatched?._id]);
  const variantSignal = resolveVariantSignal(variantMatched, freshStock);
  const soldOut = cartBtn && !!variantMatched && isSoldOut(variantSignal);
  const stockNote = cartBtn && variantMatched ? getStockNote(variantSignal) : null;

  const unavailable = isUnavailable || (cartBtn && !variantMatched) || soldOut;
  // PRD-013: the same item_id the e-commerce events send (variant id).
  const analyticsItemId = getAnalyticsItemId(data, variantMatched);

  useEffect(() => {
    gsap.set(".MobileImageSlider_thumbnails, .MobileImageSlider_swiper, .MobileImageSlider_nav, .productDetail_info ,.productDetail_options ,.productDetail_addtocart,.accordion_container", {
      opacity: 0
    })
    gsap.to(".MobileImageSlider_thumbnails, .MobileImageSlider_swiper, .MobileImageSlider_nav, .productDetail_info ,.productDetail_options ,.productDetail_addtocart,.accordion_container", {
      opacity: 1,
      delay: 0.5,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
  }, [slug, data, variantMatched])

  // PRD-014 FE-24: one view_item / ViewContent per product view, not one
  // per option change (the variant at first render is the default one).
  const viewTrackedRef = useRef(null);
  useEffect(() => {
    if (!data?._id || viewTrackedRef.current === data._id) return;
    viewTrackedRef.current = data._id;
    fpixel.event("ViewContent", {
      content_name: data.name,
      content_category: data.categories?.[0]?.name,
      content_ids: [data._id],
      content_type: 'product',
      value: defaultVariant?.price || basePrice,
      currency: 'INR'
    });
    trackEcomEvent.viewItem(data, defaultVariant);
  }, [data, defaultVariant, basePrice])

  const handleAddToCart = async () => {
    if (!cartBtn || unavailable || !variantMatched?._id) return;

    try {
      const productId = data?._id;
      if (!productId) throw new Error("Product ID not found");

      // IDs only: the server prices the line (no client price, ever).
      const input = {
        productId,
        variantId: variantMatched._id,
        qty: 1,
      };

      // Guests use a server-issued id, re-issued once if it's rejected.
      if (isLoggedIn) {
        await addItemToCart({ variables: { input } });
      } else {
        await runWithGuestId((guestId) =>
          addItemToCart({ variables: { input, guestId } }),
        );
      }

      fpixel.event("AddToCart", {
        content_name: data.name,
        content_category: data.categories?.[0]?.name,
        content_ids: [data?._id],
        content_type: 'product',
        value: finalPrice,
        currency: 'INR'
      });

      trackEcomEvent.addToCart(data, variantMatched);

      toast.success("Product added to the cart successfully");
      openCart();
    } catch (err) {
      console.error(err);
      if (getErrorInfo(err).reason === "PRODUCT_UNAVAILABLE") {
        setIsUnavailable(true);
      }
      toast.error(getErrorMessage(err, "Failed to add item to cart"));
    }
  };

  const handleNotifyMe = async () => {
    if (!unavailable) return;
    // PRD-020 FR-12: guests subscribe with an email, no login needed.
    const email = isLoggedIn ? user?.email : notifyEmail.trim();
    if (!isLoggedIn && !EMAIL_PATTERN.test(email)) {
      toast.error("Enter your email to be notified.");
      return;
    }
    try {
      const productId = data?._id;
      if (!productId) throw new Error("Product ID not found");

      const payload = {
        input: {
          productId,
          ...(email ? { email } : {}),
          ...(variantMatched?._id ? { variantId: variantMatched._id } : {}),
        },
      };

      await createNotifyRequest({ variables: payload });
      trackNotifyMe(analyticsItemId, variantMatched?._id);
      // CP-22: a guest's alert starts only after the emailed link is opened.
      toast.success(getNotifyMeSuccessMessage(isLoggedIn));
      if (!isLoggedIn) setNotifyEmail("");
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to notify"));
    }
  };

  return (
    <>
      <SeoHeader meta={meta} productData={data} breadcrumbList={breadcrumbList} />
      <div className="productDetail_main padding">
        <ProductImageGrid filter={assetsFilter} data={data?.assets || []} title={data?.name} itemId={analyticsItemId} />
        <ProductContant
          data={data || {}}
          finalPrice={finalPrice}
          cartBtn={cartBtn}
          variantMatched={variantMatched}
          loading={loading}
          notifyLoading={notifyLoading}
          isOutOfStock={unavailable}
          isSoldOut={soldOut}
          stockNote={stockNote}
          freshStock={freshStock}
          showNotifyEmail={!isLoggedIn}
          notifyEmail={notifyEmail}
          setNotifyEmail={setNotifyEmail}
          setFinalPrice={setFinalPrice}
          setCartBtn={setCartBtn}
          setAssetsFilter={setAssetsFilter}
          setVariantMatched={setVariantMatched}
          handleAddToCart={handleAddToCart}
          handleNotifyMe={handleNotifyMe}
          analyticsItemId={analyticsItemId}
        />
      </div>
      <ProductReviews reviews={reviews} totalCount={reviewCount} />
      <ProductListGrid title="You may also like" data={productList} />
    </>
  );
}
