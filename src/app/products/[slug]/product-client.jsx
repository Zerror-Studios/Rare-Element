"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";
import { trackEcomEvent } from "@/utils/analytics";
import { getAnalyticsItemId, trackNotifyMe } from "@/utils/analytics-events";
import * as fpixel from "@/lib/fpixel";
import { getMinVariantPrice } from "@/utils/Util";
import { getErrorInfo, getErrorMessage } from "@/utils/errors";

export default function ProductClient({ meta, data, productList, slug }) {
  const breadcrumbList = [
    { name: data?.categories?.[0]?.name || "Products", slug: data?.categories?.[0]?.slug ? `/${data.categories[0].slug}` : "/products" },
    { name: data?.name, slug: `/products/${data?.slug}` }
  ];

  const router = useRouter();
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
  const { user, isLoggedIn } = useAuthStore((state) => state);
  const { openCart } = useCartStore((state) => state);

  const [addItemToCart, { loading }] = useMutation(ADD_ITEM_TO_CART);
  const [createNotifyRequest, { loading: notifyLoading }] = useMutation(REQUEST_BACK_IN_STOCK);

  useEffect(() => {
    setIsUnavailable(false);
  }, [variantMatched, slug]);

  const unavailable = isUnavailable || (cartBtn && !variantMatched);
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

    if (data) {
      fpixel.event("ViewContent", {
        content_name: data.name,
        content_category: data.categories?.[0]?.name,
        content_ids: [data._id],
        content_type: 'product',
        value: finalPrice,
        currency: 'INR'
      });
      trackEcomEvent.viewItem(data, variantMatched);
    }
  }, [slug, data, variantMatched])

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
    if (!isLoggedIn) return router.push("/login");
    try {
      const productId = data?._id;
      if (!productId) throw new Error("Product ID not found");

      const payload = {
        input: {
          productId,
          email: user?.email,
          ...(variantMatched?._id ? { variantId: variantMatched._id } : {}),
        },
      };

      await createNotifyRequest({ variables: payload });
      trackNotifyMe(analyticsItemId, variantMatched?._id);
      toast.success("You’ll be notified when this item is back in stock!");
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
          setFinalPrice={setFinalPrice}
          setCartBtn={setCartBtn}
          setAssetsFilter={setAssetsFilter}
          setVariantMatched={setVariantMatched}
          handleAddToCart={handleAddToCart}
          handleNotifyMe={handleNotifyMe}
          analyticsItemId={analyticsItemId}
        />
      </div>
      <ProductListGrid title="You may also like" data={productList} />
    </>
  );
}
