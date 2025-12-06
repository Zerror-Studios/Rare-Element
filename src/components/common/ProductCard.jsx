import React from 'react'

const ProductCard = ({ name, price, assets }) => {
    return (
        <>
            <div className="shopCard_card">
                <div className="heart_icon">
                    <div className="icon_pr">
                        <img className='  short_links_icon_heart invert' src="/icons/heart.svg" alt="loading" />
                        <img className=' short_links_icon_heart_hover' src="/icons/heartFill.svg" alt="loading" />
                    </div>
                </div>
                <img
                    className='shopCard_hoverImg'
                    src={assets?.[1]?.path}
                    alt={assets?.[1]?.altText || ""}
                />

                <div className="shopCard_img_wrapper center">
                    <img
                        src={assets?.[0]?.path}
                        alt={assets?.[0]?.altText || ""}
                    />
                </div>
                <div className="shopCard_card_info">
                    <div>
                        <p className="shopCard_item_name text-sm uppercase">{name || ""}</p>
                        <p className="shopCard_item_price text-sm">{price}</p>
                    </div>

                </div>
            </div>
        </>
    )
}

export default ProductCard