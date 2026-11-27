"use client";

import React, { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import gsap from "gsap";
import Header from "@/components/common/Header";
import MobileHeader from "@/components/common/MobileHeader";
import Footer from "@/components/common/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { usePathname } from "next/navigation";
import { RiCloseLine } from "@remixicon/react";
import { useSizeGuideStore } from "@/store/sizeguide-store";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import StoreChatLauncher from "@/components/chat/StoreChatLauncher";
import SignupPopup from "@/components/common/SignupPopup";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const { isCartOpen, openCart, closeCart } = useCartStore((state) => state);
  const { isSizeGuideOpen, sizeGuideImage, closeSizeGuide } = useSizeGuideStore((state) => state);

  const overlayRef = useRef()
  const sizeGuideRef = useRef(null)
  // PRD-014 UX-31: focus trap, Escape and inert-while-closed.
  useDialogA11y(sizeGuideRef, isSizeGuideOpen, closeSizeGuide)

  useEffect(() => {
    const isOverlayActive = isCartOpen || isSizeGuideOpen;
    gsap.set(overlayRef.current, {
      pointerEvents: isOverlayActive ? "auto" : "none",
    });
  }, [isCartOpen, isSizeGuideOpen]);

  useEffect(() => {
    if (window.innerWidth < 1020) {
      if (isSizeGuideOpen) {
        if (window.lenis) window.lenis.stop();
        const tedv = gsap.timeline();
        tedv.to(".ring_size_guide", {
          right: "0",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 1,
            duration: 0.5,
          }, "<+=0.1")

      } else {
        if (window.lenis) window.lenis.start();
        const dsc = gsap.timeline();
        dsc.to(".ring_size_guide", {
          right: "-100%",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
          }, "<+=0.1")
      }

    } else {
      if (isSizeGuideOpen) {
        if (window.lenis) window.lenis.stop();
        const tedv = gsap.timeline();
        tedv.to(".ring_size_guide", {
          right: "0",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 1,
            duration: 0.5,
          }, "<+=0.1")

      } else {
        if (window.lenis) window.lenis.start();
        const dsc = gsap.timeline();
        dsc.to(".ring_size_guide", {
          right: "-51vw",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
          }, "<+=0.1")
      }

    }
  }, [isSizeGuideOpen])

  useGSAP(() => {
    gsap.to(".whatsapp_chat", {
      opacity: 1,
      delay: 2,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
  })

  return (
    <>
      {/* PRD-049 B0/B0.1: the store chat, else the WhatsApp link as before */}
      <StoreChatLauncher />
      {/* PRD-050 D22: the store's sign-up pop-up, when it has one */}
      <SignupPopup />
      <div
        ref={sizeGuideRef}
        className="ring_size_guide"
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        tabIndex={-1}
      >
        <div className="ring_size_guide_img_paren center">
          <Image
            sizes="(max-width: 960px) 100vw, 960px"
            height={1080}
            width={960}
            src={sizeGuideImage?.path || "/green_logo.svg"}
            alt={sizeGuideImage?.altText || "Size guide"}
            className="w-full h-auto"
          />
        </div>
        <button
          type="button"
          onClick={() => { closeSizeGuide() }}
          aria-label="Close size guide"
          className="cartBag_menuHeaderClose">
          <RiCloseLine size={14} className='close_icon' aria-hidden="true" />
        </button>
      </div>
      <div
        onClick={() => {
          closeCart();
          closeSizeGuide();
        }}
        ref={overlayRef} className="header_overlay scroller_none" />
      <CartDrawer isOpen={isCartOpen} overlayRef={overlayRef} closeCart={closeCart} />
      <Header openCart={openCart} />
      <MobileHeader openCart={openCart} />
      {children}
      {pathname !== "/login" && <Footer />}
    </>
  );
};

export default Layout;
