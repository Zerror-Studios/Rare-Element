import { formatePrice, renderVariants } from '@/utils/Util';
import Image from 'next/image'
import Link from 'next/link';
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn';
import gsap from 'gsap';

const WishlistPopup = ({ item, popupActive, setPopupActive, handleAddItem, handleRemoveItem, onClose }) => {

    useEffect(() => {
        if (popupActive) {
            gsap.to(".add_popup_paren", {
                opacity: 1,
                ease: "expo.out",
                duration:.5,
                pointerEvents: "auto"
            })
        }
        else {
            gsap.to(".add_popup_paren", {
                opacity: 0,
                ease: "expo.out",
                duration:.5,
                pointerEvents: "none"
            })
        }

    }, [popupActive])


    return (
        <>
            <div className="add_popup_paren center">
                <div className="add_popup">
                    <h2 className='text-xl'>Add to Wishlist</h2>
                    <div className="wishlist_item_popup">
                        <div className="wishlist_item_popup_img_wrapper">
                            <div className='cover'>
                                <Image
                                    width={150}
                                    height={250}
                                    className="cover"
                                    src={"/images/homepage/category/bracelets.svg"}
                                    alt={"loading"}
                                />
                            </div>
                        </div>
                        <div className="cartBag_bagItemDetails">
                            <div className="cartBag_bagItemTop">
                                <div className="cartBag_itemHead">
                                    <Link scroll={false} href={`/products/`} className="cartBag_itemName text-base">
                                        <p>
                                            {item?.name}
                                        </p>
                                    </Link>
                                    <div className="cart_varients_div">
                                        {renderVariants(item?.product?.productOptions || [], item?.variantDetail?.selectedOptions || [])}
                                    </div>
                                </div>
                                <p className='text-xl crt_itms_price'>{` ${formatePrice(
                                    item?.variantDetail?.variantPrice || 0
                                )}`}</p>
                            </div>
                        </div>
                    </div>

                    <div className="wishlist_btn">

                        <button
                            type="button"
                            onClick={()=>setPopupActive(false)}
                            className="cancel_form_btn"
                        >
                            Cancel
                        </button>

                        <GreenBoxBtn title="Add" />
                    </div>

                </div>

            </div>
        </>
    )
}

export default WishlistPopup