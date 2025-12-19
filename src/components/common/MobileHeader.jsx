import React, { useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
import { useAuthStore } from '@/store/auth-store';
import { RiArrowRightSLine } from '@remixicon/react';
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
      { label: "Instagram", href: "https://instagram.com" },
      { label: "WhatsApp", href: "https://wa.me/0000000000" },
      { label: "contact@nahara.co.in", href: "https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs" },
    ],
  },
]

const MobileHeader = ({ openCart }) => {

  CustomEase.create("in-out-quint", "0.83,0,0.17,1");
  const { isLoggedIn } = useAuthStore((state) => state);

  const pathname = usePathname()

  useEffect(() => {
    if (window.innerWidth > 750) return
    if (pathname !== "/") {
      gsap.set(".mobile_header_bg", { top: 0 });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth > 750) return
    if (pathname === "/") {
      gsap.set(".mobile_dummy_paren", { display: "block" });
      gsap.set(".mobile_header", {
        position: "sticky",
        height: "4rem",
        display: "flex",
      });
      gsap.set(".mobile_header_bg", { top: "-4.1rem", height: "4rem" });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth > 750) return
    if (pathname !== "/") {
      gsap.set(".mobile_dummy_paren", { display: "none" });
      gsap.set(".mobile_header", { top: 0, position: "fixed", left: 0 });
    }
  }, [pathname]);

  useEffect(() => {
    if (window.innerWidth > 750) return
    if (pathname !== "/") return;

    // Kill old ScrollTriggers
    ScrollTrigger.getAll().forEach((t) => t.kill());

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

    // Cleanup
    return () => {
      tl.kill();
      ScrollTrigger.killAll();
    };
  }, [pathname]);

  const openMenu = () => {
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

  return (
    <>


      <div className="mobile_menu_classname_open_menu">

        <div className="mobile_menu_classname_close_icon_container">
          <img onClick={() => closeMenu()}
            src="/icons/close.svg" alt="loading" />
        </div>
        <div className="mobile_menu_header">
          {isLoggedIn ? (
            <div className="login_header">
              <Link scroll={false} onClick={() => closeMenu()} href={isLoggedIn ? "/account/settings" : "/login"}>
                <img className='short_links_icon' src="/icons/profile.svg" alt="loading" />
              </Link>
              <h2 className='text-xl'>Welcome Sunny</h2>
            </div>
          ) : (
            <Link scroll={false} href={"/login"} onClick={() => closeMenu()}>
              <p className='text-base uppercase '>Login/Signup</p>
            </Link>
          )}
        </div>

        <div className="links_paren">
          <Link scroll={false} href={"/"} className='menu_links_iner' onClick={() => closeMenu()}>
            <h2 className='text-3xl capitalize '>Home</h2>
            <RiArrowRightSLine size={16} />
          </Link>
          <div className="">
            <Link scroll={false} href={"/rings"} className='menu_links_iner' onClick={() => closeMenu()}>
              <h2 className='text-3xl capitalize '>Categories</h2>
              <RiArrowRightSLine size={16} />
            </Link>
            <div data-lenis-prevent className="home_category_paren scroller_none">
              <div className="home_category_inner scroller_none">
                {MenuData?.map((item, index) => (
                  <Link scroll={false}  key={index} href={`${item?.link}`} onClick={() => closeMenu()}>
                    <div className="category_box">
                      <div className="category_box_img_paren">
                        <img src={item?.image} className='category_box_img' alt={item?.title || ""} />
                      </div>
                      <p className='text-sm bold uppercase'>{item?.title || ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link scroll={false} href={"/about"} className='menu_links_iner' onClick={() => closeMenu()}>
            <h2 className='text-3xl capitalize '>about</h2>
            <RiArrowRightSLine size={16} />
          </Link>

          <Link scroll={false} href={"/contact"} className='menu_links_iner' onClick={() => closeMenu()}>
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
                  <Link scroll={false} key={index} href={`${item?.href}`} onClick={() => closeMenu()}>
                    <p className='text-sm menu_footer_title_inner'>{item?.label}</p>
                  </Link>
                ))}
              </div>
            ))
          }
        </div>

      </div>


      <div className="mobile_dummy_paren"></div>
      <div className="mobile_header padding">
        <div className="mobile_header_bg"></div>
        <div className="mobile_menu_icon_paren">
          <img onClick={openMenu} className='short_links_icon' src="/icons/menu.svg" alt="loading" />
        </div>
        <div className="mobile_logo_paren">
          <Link scroll={false} href="/">
            <img className='mobile_logo' src="/logo.svg" alt="loading" />
          </Link>
        </div>
        <div className=" mobile_header_right ">
          <Link scroll={false} href={isLoggedIn ? "/account/wishlist" : "/login"}>
            <img className='short_links_icon' src="/icons/heart.svg" alt="loading" />
          </Link>
          <img onClick={openCart} className='short_links_icon' src="/icons/cart.svg" alt="loading" />
        </div>
      </div>
    </>
  )
}

export default MobileHeader