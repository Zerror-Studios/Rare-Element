"use client";

import { formatePrice } from '@/utils/Util';
import Link from 'next/link';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn';
import gsap from 'gsap';
import { useAuthStore } from '@/store/auth-store';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'react-toastify';
import { RiCloseLine } from '@remixicon/react';
import { CtaEnum, trackCtaClick } from '@/utils/analytics-events';

const WishlistPopup = ({ item, popupActive, setPopupActive, handleAddItem, handleRemoveItem, onClose }) => {
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const popupRef = useRef(null);
    const { isWishlisted, toggle, toggling: loading } = useWishlist();

    useEffect(() => {
        if (popupActive) {
            gsap.to(".add_popup_paren", {
                opacity: 1,
                ease: "expo.out",
                duration: .5,
                pointerEvents: "auto"
            })
        }
        else {
            gsap.to(".add_popup_paren", {
                opacity: 0,
                ease: "expo.out",
                duration: .5,
                pointerEvents: "none"
            })
        }

    }, [popupActive])

    const handleSaveToWishlist = async () => {
        trackCtaClick(CtaEnum.WISHLIST, {
            itemId: item?.variantId || item?.productId,
        });
        if (!isLoggedIn) {
            setPopupActive(false);
            onClose?.();
            router.push('/login');
            return;
        }
        // toggleWishlist removes a product that is already saved, so only
        // call it when the product isn't in the wishlist yet.
        if (!isWishlisted(item?.productId)) {
            const added = await toggle(item?.productId, item?.variantId, { silent: true });
            if (added === null) return;
        }
        toast.success("Saved to wishlist");
        // Remove from cart
        await handleRemoveItem(item?.productId, item?.variantId, true);
        setPopupActive(false);
    };

    const confirmRemove = async () => {
        await handleRemoveItem(item?.productId, item?.variantId, true);
        setPopupActive(false);
    };

    useEffect(() => {
        if (!popupActive) return;

        const handleOutsideClick = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setPopupActive(false);
                onClose?.();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [popupActive]);

    const firstAsset = item?.asset?.path || "/images/homepage/category/bracelets.svg";
    return (
        <>
            <div className="add_popup_paren center">
                <div ref={popupRef} className="add_popup">
                    <div
                        onClick={() => setPopupActive(false)}
                        className="popup_close_icon">
                        <RiCloseLine size={14} />
                    </div>
                    <h2 className='text-xl'>Don’t want to lose this?</h2>
                    <p className='add_popup_under_txt text-sm'>Save it to your wishlist so you can find it easily later.</p>
                    <div className="wishlist_item_popup">
                        <div className="wishlist_item_popup_img_wrapper">
                            <div className='cover'>
                                <Image
                                    width={150}
                                    height={250}
                                    className="cover"
                                    src={firstAsset}
                                    alt={item?.name || "Wishlist Item"}
                                    sizes="150px"
                                />
                            </div>
                        </div>
                        <div className="cartBag_bagItemDetails">
                            <div className="cartBag_bagItemTop">
                                <div className="cartBag_itemHead">
                                    <Link prefetch={false} scroll={false} href={`/products/${item?.productId}`} className="cartBag_itemName text-base">
                                        <p>
                                            {item?.name}
                                        </p>
                                    </Link>
                                </div>
                                <p className='text-xl crt_itms_price'>{` ${formatePrice(
                                    item?.finalPrice || 0
                                )}`}</p>
                            </div>
                        </div>
                    </div>

                    <div className="wishlist_btn">

                        <button
                            type="button"
                            onClick={confirmRemove}
                            className="cancel_form_btn"
                        >
                            Remove anyway
                        </button>

                        <GreenBoxBtn
                            loading={loading}
                            title="Save to wishlist"
                            onClick={handleSaveToWishlist}
                        />
                    </div>

                </div>

            </div>
        </>
    )
}

export default WishlistPopup