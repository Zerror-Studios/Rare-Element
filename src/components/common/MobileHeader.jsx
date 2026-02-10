import React, { useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
import { useAuthStore } from '@/store/auth-store';
import { RiArrowRightSLine } from '@remixicon/react';
import Image from 'next/image';
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
      { label: "hello@nahara.co.in", href: "https://mail.google.com/mail/u/0/#inbox?compose=https://mail.google.com/mail/u/0/#inbox?compose=DmwnWsCZFQTSPKdBWzqptmWzRGSXbXPcgGKFLkKhbNnbbmlgJgCbMhkZCbbJRRqmCSbHhCHFkrGB" },
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
          <Image height={25} width={25} onClick={() => closeMenu()}
            src="/icons/close.svg" alt="img" title='close icon' />
        </div>
        <div className="mobile_menu_header">
          {isLoggedIn ? (
            <div className="login_header">
              <Link scroll={false} onClick={() => closeMenu()} href={isLoggedIn ? "/account/settings" : "/login"} title="profile">
                <Image height={25} width={25} className='short_links_icon' src="/icons/profile.svg" alt="img" title='profile' />
              </Link>
              <h2 className='text-xl'>Welcome Sunny</h2>
            </div>
          ) : (
            <Link scroll={false} href={"/login"} onClick={() => closeMenu()} title='login'>
              <p className='text-base uppercase '>Login/Signup</p>
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
                        <Image width={200} height={200} src={item?.image} className='category_box_img' alt={item?.title || ""} title={item?.title || ""} />
                      </div>
                      <p className='text-sm bold uppercase'>{item?.title || ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link scroll={false} href={"/about"} title='about us' className='menu_links_iner' onClick={() => closeMenu()}>
            <h2 className='text-3xl capitalize '>about</h2>
            <RiArrowRightSLine size={16} />
          </Link>

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


      <div className="mobile_dummy_paren"></div>
      <div className="mobile_header padding">
        <div className="mobile_header_bg"></div>
        <div className="mobile_menu_icon_paren">
          <Image height={25} width={25} onClick={openMenu} className='short_links_icon' src="/icons/menu.svg" alt="img" title='menu' />
        </div>
        <div className="mobile_logo_paren">
          <Link scroll={false} href="/" title='home'>
            <Image height={25} width={25} className='mobile_logo' src="/logo.svg" alt="img" title='logo' />
          </Link>
        </div>
        <div className=" mobile_header_right ">
          <Link scroll={false} title='wishlist' href={isLoggedIn ? "/account/wishlist" : "/login"}>
            <Image height={25} width={25} className='short_links_icon' src="/icons/heart.svg" alt="img" title='Wishlist' />
          </Link>
          <Image height={25} width={25} onClick={openCart} className='short_links_icon' src="/icons/cart.svg" alt="img" title='cart' />
        </div>
      </div>
    </>
  )
}

export default MobileHeader