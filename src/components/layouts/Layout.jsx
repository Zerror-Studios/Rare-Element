import React, { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import gsap from "gsap";
import Header from "@/components/common/Header";
import MobileHeader from "@/components/common/MobileHeader";
import Footer from "@/components/common/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { usePathname } from "next/navigation";
import Introloader from "../common/Introloader";
import { RiCloseLine } from "@remixicon/react";
import { useSizeGuideStore } from "@/store/sizeguide-store";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import Link from "next/link";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const { isCartOpen, openCart, closeCart } = useCartStore((state) => state);
  const { isSizeGuideOpen, sizeGuideImage, closeSizeGuide } = useSizeGuideStore((state) => state);

  const overlayRef = useRef()

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

      <Link target="_blank" href="https://wa.me/910000000000">
        <div className="whatsapp_chat">
          <div className="whatsapp_chat_img center">
            <img className="cover" src="/gifs/whatsapp.gif" alt="loading" />
          </div>
          <p className="bold">CHAT</p>
        </div>
      </Link>
      <div className="ring_size_guide">
        <div className="ring_size_guide_img_paren center">
          <Image
            height={1080}
            width={960}
            src={sizeGuideImage?.path || "/green_logo.svg"}
            alt={sizeGuideImage?.altText || "Size guide"}
            className="w-full h-auto"
          />
        </div>
        <div
          onClick={() => { closeSizeGuide() }}
          className="cartBag_menuHeaderClose">
          <RiCloseLine size={14} className='close_icon' />
        </div>
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
