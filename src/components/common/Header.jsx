"use client";

import React, { useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { useAuthStore } from "@/store/auth-store";
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger, CustomEase)

CustomEase.create("ease-secondary", "0.16, 1, 0.35, 1");

const Header = ({ openCart }) => {
  const pathname = usePathname()
  const { isLoggedIn } = useAuthStore((state) => state);
  const homePagePath = "/";

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
      gsap.set(".header", { top: 0, position: "fixed", opacity: 1, left: 0 });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth < 750) return;
    if (pathname !== "/") return;

    const ctx = gsap.context(() => {

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

    });

    return () => ctx.revert();

  }, [pathname]);

  useGSAP(() => {
    if (pathname !== "/") return;
    gsap.to(".header", {
      opacity: 1,
      delay: 1.5,
      stagger: 0.2
    })
  })

  return (
    <>
      <div style={{ display: pathname === homePagePath ? "block" : "none" }} className="dummy_paren"></div>
      <div style={{ position: pathname === homePagePath ? "sticky" : "fixed" }} className="header padding">
        <div className="header_bg"></div>
        <div className="logo_paren">
          <Link aria-label="Nahara Home" scroll={false} href="/" >
            <Image width={25} height={25} className='header_logo' src="/logo.svg" alt="Nahara Logo" />
          </Link>
        </div>
        <div className="nav_links">
          <Link
            aria-label="Shop All Products"
            prefetch={true}
            scroll={false}
            href="/products"
            style={{
              pointerEvents: pathname === "/products" ? "none" : "auto",
            }}
          >
            <p
              className={`text-sm hover_text ${pathname === "/products" ? "active" : ""
                }`}
            >
              All
            </p>
          </Link>

          {MenuData.map((item, index) => (
            <Link
              key={index}
              aria-label={`Shop ${item.title}`}
              prefetch={true}
              scroll={false}
              href={item.link}
              style={{
                pointerEvents: pathname === item.link ? "none" : "auto",
              }}
            >
              <p
                className={`text-sm hover_text ${pathname === item.link ? "active" : ""
                  }`}
              >
                {item.title}
              </p>
            </Link>
          ))}
        </div>
        <div className="short_links">
          <Link aria-label="View Wishlist" scroll={false} href={isLoggedIn ? "/account/wishlist" : "/login"} >
            <Image height={25} width={25} className='short_links_icon' src="/icons/heart.svg" alt="Wishlist Icon" />
          </Link>
          <Link aria-label="My Account" scroll={false} href={isLoggedIn ? "/account/settings" : "/login"} >
            <Image height={25} width={25} className='short_links_icon' src="/icons/profile.svg" alt="Profile Icon" />
          </Link>
          <button aria-label="Open Cart" onClick={openCart}>
            <Image height={25} width={25} className='short_links_icon' src="/icons/cart.svg" alt="Cart Icon" />
          </button>
        </div>
      </div>
    </>
  )
}

export default Header