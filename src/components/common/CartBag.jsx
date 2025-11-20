import { RiCloseLine } from '@remixicon/react';
import gsap from 'gsap';
import Link from 'next/link'
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn';

const CartBag = ({ openCartBag, setOpenCartBag, headerOverlayRef }) => {

    useEffect(() => {
        if (window.innerWidth < 1020) {
            if (openCartBag) {
                const tedv = gsap.timeline();
                tedv.to(".cartBag_openBagParent", {
                    opacity: 1,
                    height: "40rem",
                    ease: "power2.out",
                    duration: 0.5
                })
                    .to(headerOverlayRef.current, {
                        opacity: 1,
                        duration: 0.5,
                    }, "<+=0.1")

            } else {
                const dsc = gsap.timeline();
                dsc.to(".cartBag_openBagParent", {
                    opacity: 0,
                    height: 0,
                    ease: "power2.out",
                    duration: 0.5
                })
                    .to(headerOverlayRef.current, {
                        opacity: 0,
                        duration: 0.5,
                    }, "<+=0.1")
            }

        } else {
            if (openCartBag) {
                if (window.lenis) window.lenis.stop();
                const tedv = gsap.timeline();
                tedv.to(".cartBag_openBagParent", {
                    opacity: 1,
                    right: "2rem",
                    ease: "power2.out",
                    duration: 0.5
                })
                    .to(headerOverlayRef.current, {
                        opacity: 1,
                        duration: 0.5,
                    }, "<+=0.1")

            } else {
                if (window.lenis) window.lenis.start();
                const dsc = gsap.timeline();
                dsc.to(".cartBag_openBagParent", {
                    opacity: 0,
                    right: "-38rem",
                    ease: "power2.out",
                    duration: 0.5
                })
                    .to(headerOverlayRef.current, {
                        opacity: 0,
                        duration: 0.5,
                    }, "<+=0.1")
            }

        }
    }, [openCartBag])

    return (
        <>
            <div className="cartBag_openBagParent">
                <div className="cartBag_bagHeader">
                    <div className="cartBag_bagHeaderLeft">
                        <p className="cartBag_bagTitle text-sm">Bag</p>
                        <p className="cartBag_bagCount text-sm">3</p>
                    </div>
                    <div
                        onClick={() => { setOpenCartBag(false) }}
                        className="cartBag_menuHeaderClose">
                        <RiCloseLine size={14} />
                    </div>
                </div>

                <div data-lenis-prevent className="cartBag_bagScroll">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="cartBag_bagItem">
                            <div className="cartBag_bagItemInner">
                                <div className="cartBag_bagImageWrapper">
                                    <img
                                        className="cartBag_bagImage"
                                        src="http://localhost:3000/images/homepage/category/earings.svg"
                                        alt=""
                                    />
                                </div>
                                <div className="cartBag_bagItemDetails">
                                    <div className="cartBag_bagItemTop">
                                        <div>
                                            <p className="cartBag_itemName text-base">Product Name</p>
                                            <p className="cartBag_itemSize text-sm">Size</p>
                                        </div>
                                        <p className='text-base'>₹ 599</p>
                                    </div>
                                    <div className="cartBag_bagItemBottom">
                                        <div className="cartBag_qtyControl text-base">
                                            <p>−</p>
                                            <p>1</p>
                                            <p>+</p>
                                        </div>
                                        <div className="cartBag_removeButton">
                                            <p className="cartBag_removeText underline text-xs">Remove</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cartBag_bagFooter">
                    <div className="cartBag_totalRow text-xl">
                        <p>Total</p>
                        <p>₹ 1,797</p>
                    </div>
                    <Link href="/checkout">
                        <div
                            onClick={() => { setOpenCartBag(false) }}
                            className="cartBag_checkoutButton">
                            <GreenBoxBtn text={"Checkout"} />
                        </div>
                    </Link>
                    <div className="cartBag_continueShopping">
                        <p className="cartBag_continueText text-sm underline">Continue Shopping</p>
                    </div>
                </div>
            </div>

        </>
    )
}

export default CartBag