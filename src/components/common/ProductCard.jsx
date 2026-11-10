"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useWishlist } from "@/hooks/useWishlist";
import {
    CtaEnum,
    getAnalyticsItemId,
    trackCtaClick,
    trackSelectItem,
} from "@/utils/analytics-events";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import { getListingBadge } from "@/utils/stock-signal";

// Badge names are admin-only in the API today (Product exposes badgeIds), so
// `badge` is an optional label supplied by the caller; without one the card
// shows the PRD-020 stock badge ("Sold out" / "Low stock") from
// `product.availability` (null = no badge, as before).
// `product` + `listName` (optional) let the card send GA4 `select_item`
// (PRD-013; `listId`: a lookbook's GA4 item_list_id, PRD-027 F10); the
// click still bubbles to the caller's <Link>.
const ProductCard = React.memo(({ productId, name, badge, price, assets, product, listName, listId }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const { isWishlisted: checkWishlisted, toggle } = useWishlist();
    const isWishlisted = checkWishlisted(productId);

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        trackCtaClick(CtaEnum.WISHLIST, {
            itemId: getAnalyticsItemId(product) || productId,
        });
        await toggle(productId);
    };

    const handleSelect = () => {
        if (product) trackSelectItem(product, listName, listId);
    };


    const ribbon = badge || getListingBadge(product?.availability);

    const featuredAsset = assets?.find(a => a.isFeatured === true);
    const hoverAsset = assets?.find(a => a.isHover === true);

    const mainImage =
        featuredAsset && hoverAsset
            ? featuredAsset
            : assets?.[0];

    const hoverImage =
        featuredAsset && hoverAsset
            ? hoverAsset
            : assets?.[1];

    return (
        <>
            <div className="shopCard_card" onClick={handleSelect}>
                {ribbon && (
                    <div className="ribbon_btn">
                        <p className="text-xs">{ribbon}</p>
                    </div>
                )}
                {/* Heart Icons */}
                <div className="heart_icon" onClick={handleWishlistToggle} aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"} role="button">
                    <div className="icon_pr">
                        <Image
                            className={`short_links_icon_heart invert ${isWishlisted ? 'hidden' : ''}`}
                            src="/icons/heart.svg"
                            alt="Heart Icon"
                            width={24}
                            height={24}
                            priority={false}
                            sizes="24px"
                        />
                        <Image
                            className={`short_links_icon_heart_hover ${isWishlisted ? 'show_filled' : ''}`}
                            src="/icons/heartFill.svg"
                            alt="Filled Heart Icon"
                            width={24}
                            height={24}
                            priority={false}
                            sizes="24px"
                        />
                    </div>
                </div>

                {/* Hover Image */}
                <div className="shopCard_hoverImg center">
                    <div className="shopCard_img_wrapper_img">
                        <Image
                            className="cover"
                            src={hoverImage?.path || "/green_logo.svg"}
                            alt={hoverImage?.altText || `${name} - Hover Image`}
                            width={600}
                            height={800}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
                        />
                    </div>
                </div>

                {/* Main Image */}
                {!imgLoaded && (
                    <div className="shopCard_img_wrapper  center">
                        <div className="skeleton_box main_img_skeleton skeleton_animate"></div>
                    </div>
                )}
                <div className="shopCard_img_wrapper center">
                    <div className="shopCard_img_wrapper_img">
                        <Image
                            className="cover"
                            src={mainImage?.path || "/green_logo.svg"}
                            alt={mainImage?.altText || name || "Jewellery Product"}
                            width={600}
                            height={800}
                            onLoad={() => setImgLoaded(true)}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
                        />
                    </div>
                </div>


                {/* Name + Price */}
                <div className="shopCard_card_info">
                    <p className="shopCard_item_name text-base uppercase">
                        {name || ""}
                    </p>
                    <p className="shopCard_item_price text-lg">{price}</p>
                </div>
            </div>
        </>
    );
});

export default ProductCard;
