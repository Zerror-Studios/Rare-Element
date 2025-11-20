import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import CustomEase from 'gsap/dist/CustomEase';
import CartBag from './CartBag';
gsap.registerPlugin(ScrollTrigger, CustomEase)

const navLinks = [
  {
    title: "rings",
    link: "/products"
  },
  {
    title: "earings",
    link: "/products"
  },
  {
    title: "necklaces",
    link: "/products"
  },
  {
    title: "bracelets",
    link: "/products"
  },
  {
    title: "anklets",
    link: "/products"
  },
]
const Header = ({setOpenCartBag}) => {
  const pathname = usePathname()

  useEffect(() => {
    if (window.innerWidth < 750) return
    if (pathname !== "/") {
      gsap.set(".header_bg", { top: 0 });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth < 750) return
    if (pathname === "/") {
      gsap.set(".dummy_paren", { display: "block" });
      gsap.set(".header", {
        position: "sticky",
        height: "4rem",
        display: "flex",
      });
      gsap.set(".header_bg", { top: "-4.1rem", height: "4rem" });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth < 750) return
    if (pathname !== "/") {
      gsap.set(".dummy_paren", { display: "none" });
      gsap.set(".header", { top: 0, position: "fixed", left: 0 });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth < 750) return
    if (pathname !== "/") return;

    ScrollTrigger.getAll().forEach((t) => t.kill());

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".header",
        start: "bottom top",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(".header_bg", {
      top: 0,
      duration: 0.25,
    });

    // Cleanup
    return () => {
      tl.kill();
      ScrollTrigger.killAll();
    };
  }, [pathname]);

  return (
    <>
      <div className="dummy_paren"></div>
      <div className="header padding">
        <div className="header_bg"></div>
        <div className="logo_paren">
          <Link scroll={false} href="/">
            <img className='header_logo' src="/logo.svg" alt="" />
          </Link>
        </div>
        <div className="nav_links">
          {
            navLinks.map((item, index) => (
              <Link scroll={false} href={item.link} key={index}>
                <p className='text-sm  hover_text'>{item.title}</p>
              </Link>
            ))
          }
        </div>
        <div className="short_links">
          <Link scroll={false} href="/account/wishlist">
            <img className='short_links_icon' src="/icons/heart.svg" alt="" />
          </Link>
          <button onClick={() => setOpenCartBag(true)}>
            <img className='short_links_icon' src="/icons/cart.svg" alt="" />
          </button>
          <Link scroll={false} href="/login">
            <img className='short_links_icon' src="/icons/profile.svg" alt="" />
          </Link>
        </div>
      </div>
    </>
  )
}

export default Header