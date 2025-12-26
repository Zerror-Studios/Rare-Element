import Image from "next/image";
import React from "react";

const ProductCard = ({ name, ribbon, price, assets }) => {

    const featuredAsset = assets?.find(a => a.isFeatured);

    return (
        <div className="shopCard_card">
            {ribbon?.name && (
                <div className="ribbon_btn">
                    <p className="text-xs">{ribbon.name}</p>
                </div>
            )}
            {/* Heart Icons */}
            <div className="heart_icon">
                <div className="icon_pr">
                    <Image
                        className="short_links_icon_heart invert"
                        src="/icons/heart.svg"
                        alt="heart"
                        width={24}
                        height={24}
                        priority={false}
                    />
                    <Image
                        className="short_links_icon_heart_hover"
                        src="/icons/heartFill.svg"
                        alt="heart filled"
                        width={24}
                        height={24}
                        priority={false}
                    />
                </div>
            </div>

            {/* Hover Image */}
            <div className="shopCard_hoverImg">
                <Image
                    src={featuredAsset?.path || "/green_logo.svg"}
                    alt={featuredAsset?.altText || "loading"}
                    fill
                    loading="lazy"
                    quality={75}
                />
            </div>

            {/* Main Image */}
            <div className="shopCard_img_wrapper center">
                <Image
                    src={assets?.[0]?.path || "/green_logo.svg"}
                    alt={assets?.[0]?.altText || "loading"}
                    fill
                    loading="lazy"
                    quality={75}
                />
            </div>

            {/* Name + Price */}
            <div className="shopCard_card_info">
                    <p className="shopCard_item_name text-base uppercase">
                        {name || ""}
                    </p>
                    <p className="shopCard_item_price text-lg">{price}</p>
            </div>
        </div>
    );
};

export default ProductCard;
