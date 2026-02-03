import { formatePrice, renderVariants } from '@/utils/Util';
import Image from 'next/image'
import Link from 'next/link';
import React, { useEffect, useRef } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn';
import gsap from 'gsap';
import { useMutation } from '@apollo/client/react';
import { ADD_TO_WISHLIST, GET_WISHLIST_ITEMS } from '@/graphql';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'react-toastify';
import { RiCloseLine } from '@remixicon/react';

const WishlistPopup = ({ item, popupActive, setPopupActive, handleAddItem, handleRemoveItem, onClose }) => {
    const { user } = useAuthStore();
    const popupRef = useRef(null);
    const userId = user?._id || user?.id;

    const [addToWishlist, { loading }] = useMutation(ADD_TO_WISHLIST, {
        update(cache, { data: { addToWishlist: newItem } }) {
            const existing = cache.readQuery({
                query: GET_WISHLIST_ITEMS,
                variables: { userId }
            });

            if (existing && newItem) {
                cache.writeQuery({
                    query: GET_WISHLIST_ITEMS,
                    variables: { userId },
                    data: {
                        getWishlistItems: {
                            ...existing.getWishlistItems,
                            items: [...existing.getWishlistItems.items, newItem],
                            totalCount: existing.getWishlistItems.totalCount + 1
                        }
                    }
                });
            }
        }
    });

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
        try {
            await addToWishlist({
                variables: {
                    input: {
                        productId: item?.productId,
                        ...(item?.variantDetail?.variantDetailId ? { variantId: item.variantDetail.variantDetailId } : {})
                    },
                    userId
                }
            });
            // Remove from cart
            toast.success("Saved to wishlist");
            await handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, true);
            setPopupActive(false);
        } catch (error) {
            toast.error("Failed to save to wishlist");
        }
    };

    const confirmRemove = async () => {
        await handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, true);
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
                                    alt={item?.name || ""}
                                />
                            </div>
                        </div>
                        <div className="cartBag_bagItemDetails">
                            <div className="cartBag_bagItemTop">
                                <div className="cartBag_itemHead">
                                    <Link prefetch scroll={false} href={`/products/${item?.product?.slug || item?.productId}`} className="cartBag_itemName text-base">
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