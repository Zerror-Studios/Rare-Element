
import React, { useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useAuthStore } from "@/store/auth-store";
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
gsap.registerPlugin(ScrollTrigger, CustomEase)

const Header = ({ openCart }) => {
  const pathname = usePathname()
  const { isLoggedIn } = useAuthStore((state) => state);

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
            <img className='header_logo' src="/logo.svg" alt="loading" />
          </Link>
        </div>
        <div className="nav_links">
      <Link scroll={false} href="/products">
        <p className={`text-sm hover_text ${pathname === "/products" ? "active" : ""}`}>
          All
        </p>
      </Link>

      {MenuData.map((item, index) => {
        if (item.link === "/anklets") return null;

        return (
          <Link scroll={false} href={item.link} key={index}>
            <p
              className={`text-sm hover_text ${
                pathname === item.link ? "active" : ""
              }`}
            >
              {item.title}
            </p>
          </Link>
        );
      })}
    </div>
        <div className="short_links">
          <Link scroll={false} href={isLoggedIn ? "/account/wishlist" : "/login"}>
            <img className='short_links_icon' src="/icons/heart.svg" alt="loading" />
          </Link>
          <Link scroll={false} href={isLoggedIn ? "/account/settings" : "/login"}>
            <img className='short_links_icon' src="/icons/profile.svg" alt="loading" />
          </Link>
          <button onClick={openCart}>
            <img className='short_links_icon' src="/icons/cart.svg" alt="loading" />
          </button>
        </div>
      </div>
    </>
  )
}

export default Header