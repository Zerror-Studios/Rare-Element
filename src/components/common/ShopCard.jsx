import React from 'react'

const ShopCard = ({ item }) => {
    return (
        <>
            <div className="shopCard_card">

                <div className="heart_icon">
                    <div className="icon_pr">
                        <img className='  short_links_icon_heart invert' src="/icons/heart.svg" alt="" />
                        <img className=' short_links_icon_heart_hover' src="/icons/heartFill.svg" alt="" />
                    </div>
                </div>
                <img className='shopCard_hoverImg' src={item?.hoverImage} alt="" />

                <div className="shopCard_img_wrapper center">
                    <img
                        src={item?.image}
                        alt="coverImg"
                    />
                </div>
                <div className="shopCard_card_info">
                    <div>
                        <p className="shopCard_item_name text-sm uppercase">{item?.title}</p>
                        <p className="shopCard_item_price text-sm">₹ {item?.price}</p>
                    </div>

                </div>
            </div>
        </>
    )
}

export default ShopCard