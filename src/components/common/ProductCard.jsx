import Image from "next/image";
import React from "react";

const ProductCard = ({ name, ribbon, price, assets }) => {
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
            <Image
                className="shopCard_hoverImg"
                src={assets?.[1]?.path || "/placeholder.png"}
                alt={assets?.[1]?.altText || ""}
                width={450}
                height={600}
                loading="lazy"
                quality={75}
            />

            {/* Main Image */}
            <div className="shopCard_img_wrapper center">
                <Image
                    src={assets?.[0]?.path || "/placeholder.png"}
                    alt={assets?.[0]?.altText || ""}
                    width={450}
                    height={600}
                    loading="lazy"
                    quality={75}
                />
            </div>

            {/* Name + Price */}
            <div className="shopCard_card_info">
                <div>
                    <p className="shopCard_item_name text-sm uppercase">
                        {name || ""}
                    </p>
                    <p className="shopCard_item_price text-sm">{price}</p>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
