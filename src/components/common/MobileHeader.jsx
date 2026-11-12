"use client";

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
import { useAuthStore } from '@/store/auth-store';
import { RiArrowRightSLine, RiSearchLine } from '@remixicon/react';
import Image from 'next/image';
import { useDialogA11y } from '@/hooks/useDialogA11y';
gsap.registerPlugin(ScrollTrigger, CustomEase)


const footer_links = [
  {
    title: "Support",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Shipping & Returns", href: "/shipping-returns" },
      { label: "Terms & Conditions", href: "/terms-of-service" },
    ],
  },
  {
    title: "Contact Us",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/nahara.jewellery/?igsh=MXgwcmQ2ODhnaTR3ag%3D%3D#" },
      { label: "WhatsApp", href: "https://wa.me/+919137159898" },
      { label: "hello@nahara.co.in", href: "mailto:hello@nahara.co.in" },
    ],
  },
]

const MobileHeader = ({ openCart }) => {

  CustomEase.create("in-out-quint", "0.83,0,0.17,1");
  const { isLoggedIn, user } = useAuthStore((state) => state);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const pathname = usePathname()
  // The home and page header states are classes from the route (known while
  // the server renders), so the first paint is final; they were gsap.set()
  // after hydration and moved every page down (CLS).
  const isHome = pathname === "/"

  useEffect(() => {
    if (window.innerWidth > 750) return
    if (pathname !== "/") return;

    // SF-20: revert only this component's timeline and ScrollTrigger
    // (killing every ScrollTrigger broke other components' animations).
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".mobile_header",
          start: "bottom top",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(".mobile_header_bg", {
        top: 0,
        duration: 0.25,
      });
    });

    // Cleanup
    return () => ctx.revert();
  }, [pathname]);

  const openMenu = () => {
    setIsMenuOpen(true);
    if (window.lenis) lenis.stop();
    gsap.to(".mobile_menu_classname_open_menu", {
      left: 0,
      duration: .8,
      ease: "in-out-quint",
      onComplete: () => {
        gsap.set(".mobile_header", { pointerEvents: "none" });
      }
    });
  }
  const closeMenu = () => {
    setIsMenuOpen(false);
    if (window.lenis) lenis.start();
    gsap.to(".mobile_menu_classname_open_menu", {
      left: "-100%",
      delay: 0.4,
      duration: .8,
      ease: "in-out-quint",
      onComplete: () => {
        gsap.set(".mobile_header", { pointerEvents: "auto" });
      }
    });
  }

  // PRD-014 UX-31: focus trap, Escape and inert-while-closed.
  useDialogA11y(menuRef, isMenuOpen, closeMenu);

  return (
    <>


      <div
        ref={menuRef}
        id="mobile_menu"
        className="mobile_menu_classname_open_menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
      >

        <div className="mobile_menu_classname_close_icon_container">
          <button type="button" className="mobile_icon_btn" onClick={() => closeMenu()} aria-label="Close menu">
            <Image height={25} width={25} src="/icons/close.svg" alt="" />
          </button>
        </div>
        <div className="mobile_menu_header">
          {isLoggedIn ? (
            <div className="login_header">
              <Link scroll={false} onClick={() => closeMenu()} href={isLoggedIn ? "/account/settings" : "/login"} aria-label="My account">
                <Image height={25} width={25} className='short_links_icon' src="/icons/profile.svg" alt="" />
              </Link>
              <h2 className='text-xl'>{user?.firstName ? `Welcome, ${user.firstName}` : "Welcome"}</h2>
            </div>
          ) : (
            <Link scroll={false} href={"/login"} onClick={() => closeMenu()} title='login'>
              <p className='text-base uppercase '>Sign in</p>
            </Link>
          )}
        </div>

        <div className="links_paren">
          <Link scroll={false} href={"/"} className='menu_links_iner' onClick={() => closeMenu()} title='home'>
            <h2 className='text-3xl capitalize '>Home</h2>
            <RiArrowRightSLine size={16} />
          </Link>
          <div className="">
            <Link prefetch scroll={false} href={"/products"} className='menu_links_iner' onClick={() => closeMenu()} title='view all products'>
              <h2 className='text-3xl capitalize '>Categories</h2>
              <RiArrowRightSLine size={16} />
            </Link>
            <div className="home_category_paren scroller_none">
              <div className="home_category_inner scroller_none">
                {MenuData?.map((item, index) => (
                  <Link prefetch scroll={false} key={index} href={`${item?.link}`} onClick={() => closeMenu()} title={item?.title || ""}>
                    <div className="category_box">
                      <div className="category_box_img_paren">
                        <Image sizes="50vw" width={200} height={200} src={item?.image} className='category_box_img' alt={item?.title || ""} title={item?.title || ""} />
                      </div>
                      <p className='text-sm bold uppercase'>{item?.title || ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* <Link scroll={false} href={"/about"} title='about us' className='menu_links_iner' onClick={() => closeMenu()}>
            <h2 className='text-3xl capitalize '>about</h2>
            <RiArrowRightSLine size={16} />
          </Link> */}

          <Link scroll={false} href={"/contact"} title='contact' className='menu_links_iner' onClick={() => closeMenu()}>
            <h2 className='text-3xl capitalize '>contact</h2>
            <RiArrowRightSLine size={16} />
          </Link>
        </div>

        <div className="menu_footer">
          {
            footer_links.map((item, index) => (
              <div key={index} className="">
                <p className='text-base menu_footer_title uppercase '>{item?.title}</p>
                {footer_links[index]?.links?.map((item, index) => (
                  <Link scroll={false} key={index} href={`${item?.href}`} title={item?.label} onClick={() => closeMenu()}>
                    <p className='text-sm menu_footer_title_inner'>{item?.label}</p>
                  </Link>
                ))}
              </div>
            ))
          }
        </div>

      </div>


      <div className={`mobile_dummy_paren ${isHome ? "" : "mobile_dummy_paren_off"}`}></div>
      <div className={`mobile_header padding ${isHome ? "mobile_header_home" : "mobile_header_page"}`}>
        <div className="mobile_header_bg"></div>
        <div className="mobile_menu_icon_paren">
          <button type="button" className="mobile_icon_btn" onClick={openMenu} aria-label="Open menu" aria-expanded={isMenuOpen} aria-controls="mobile_menu">
            <Image height={25} width={25} className='short_links_icon' src="/icons/menu.svg" alt="" />
          </button>
        </div>
        <div className="mobile_logo_paren">
          <Link scroll={false} href="/" aria-label="Nahara home">
            <Image height={25} width={25} className='mobile_logo' src="/logo.svg" alt="Nahara" />
          </Link>
        </div>
        <div className=" mobile_header_right ">
          <Link scroll={false} aria-label="Search products" href="/search" className="short_links_search">
            <RiSearchLine className="short_links_icon short_links_search_icon" aria-hidden="true" />
          </Link>
          <Link scroll={false} aria-label="Wishlist" href={isLoggedIn ? "/account/wishlist" : "/login"}>
            <Image height={25} width={25} className='short_links_icon' src="/icons/heart.svg" alt="" />
          </Link>
          <button type="button" className="mobile_icon_btn" onClick={openCart} aria-label="Open cart">
            <Image height={25} width={25} className='short_links_icon' src="/icons/cart.svg" alt="" />
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileHeader