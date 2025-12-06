import React, { useEffect } from 'react'
import gsap from 'gsap'
import Link from 'next/link'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { MenuData } from '@/helpers/MenuData';
import CustomEase from 'gsap/dist/CustomEase';
gsap.registerPlugin(ScrollTrigger, CustomEase)

const MobileHeader = ({ openCart }) => {

  CustomEase.create("in-out-quint", "0.83,0,0.17,1");

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
    gsap.fromTo(".mobile_menu_classname_anii", {
      y: 50,
    }, {
      y: 0,
      delay: 0.4,
      stagger: 0.05
    })
  }
  const closeMenu = () => {
    if (window.lenis) lenis.stop();
    gsap.to(".mobile_menu_classname_anii", {
      y: -50,
      stagger: 0.05
    })
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

        <div className="mobile_menu_classname_center">
          {MenuData.map((item, index) => (
            <Link scroll={false}
              key={index}
              href={item.link}
              onClick={() => closeMenu()}
              className="mobile_menu_classname_link"
            >
              <p className="mobile_menu_classname_anii text-xl">{item.title}</p>
            </Link>
          ))}
        </div>
      </div>


      <div className="mobile_dummy_paren"></div>
      <div className="mobile_header padding">
        <div className="mobile_header_bg"></div>
        <img onClick={openMenu} className='short_links_icon' src="/icons/menu.svg" alt="loading" />
        <Link scroll={false} href="/">
          <img className='mobile_logo' src="/logo.svg" alt="loading" />
        </Link>
        <img onClick={openCart} className='short_links_icon' src="/icons/cart.svg" alt="loading" />
      </div>
    </>
  )
}

export default MobileHeader