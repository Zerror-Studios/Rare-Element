import { useGSAP } from '@gsap/react';
import React, { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import SecureLock from "../../../public/icons/animationJson/SecureLock.json";
import Crafting from "../../../public/icons/animationJson/crafting.json";
import FreeShipping from "../../../public/icons/animationJson/FreeShipping.json";
import ChatSupport from "../../../public/icons/animationJson/ChatSupport.json";
import StoresRetail from "../../../public/icons/animationJson/StoresRetail.json";
import StretchArrow from "../../../public/icons/animationJson/StretchArrow.json";
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger)



export const featureData = [
  {
    id:1,
    title: "Customisation Available",
    href: "",
    animationData: Crafting,
    img: "/icons/lock.svg",
    desc: "Bespoke jewellery crafted to your vision, from design to final detail.",
  },
  {
    id:2,
    title: "Free Shipping",
    href: "/shipping-returns",
    img: "/icons/shipping.svg",
    animationData: FreeShipping,
    desc: "Enjoy seamless, complimentary delivery across India on all orders.",
  },
  {
    title: "50+ years of industry experience",
    id: 3,
    href: "",
    img: "/icons/store.svg",
    animationData: SecureLock,
    desc: "Over 50 years of master craftsmanship shaping fine jewellery.",
  },
  {
    id:4,
    title: "Dedicated Customer Service",
    href: "https://wa.me/+919137159898",
    img: "/icons/chat.svg",
    animationData: ChatSupport,
    desc: "Our friendly support team is always ready to help you with orders, queries, and guidance.",
  },
];


const footerLinksData = [
  {
    title: "Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "About ", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Category",
    links: [
      { label: "All", href: "/products" },
      { label: "Rings", href: "/rings" },
      { label: "Earrings", href: "/earings" },
      { label: "Bracelet", href: "/bracelets" },
      { label: "Necklace", href: "/necklaces" },
    ],
  },
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
];


const Footer = () => {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    gsap.to(".footer_below", {
      scrollTrigger: {
        trigger: ".footer_classname_wrapper",
        start: "15% bottom",
        end: "bottom bottom",
        scrub: true,
        // markers: true
      },
      transform: "translateY(0%)",
      opacity: 1,
      ease: "linear"
    })
  })


  return (
    <div className="footer_classname_wrapper">
      <div className="footer_classname_container">
        <div className="footer_classname_features">
          {featureData.map((item, i) => {
            const mainRef = useRef(null);
            const arrowRef = useRef(null);

            return (
              <Link
                scroll={false}
                href={item.href}
                title={item.title}
                key={i}
                onMouseEnter={() => {
                  mainRef.current?.goToAndPlay(0, true);
                  arrowRef.current?.goToAndPlay(0, true);
                }}
                className="footer_classname_featureCard"
              >
                {
                  item?.id === 1 ? (
                    <div className="featured_icon_custom">
                      <Lottie
                        lottieRef={mainRef}
                        animationData={item?.animationData}
                        autoplay={false}
                        loop={false}
                        onDOMLoaded={() => {
                          mainRef.current?.goToAndPlay(0, true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="featured_icon">
                      <Lottie
                        lottieRef={mainRef}
                        animationData={item?.animationData}
                        autoplay={false}
                        loop={false}
                      />
                    </div>
                  )
                }

                <p className="footer_classname_featureTitle bold text-sm uppercase">
                  {item.title}
                </p>

                <p className="footer_classname_featureDesc text-sm">
                  {item.desc}
                </p>

                <div className="featured_icon">
                  <Lottie
                    lottieRef={arrowRef}
                    animationData={StretchArrow}
                    autoplay={false}
                    loop={false} // play only once
                  />
                </div>
              </Link>
            );
          })}

        </div>
        <div className="footer_below">

          {/* Footer Links Section */}
          <div className="footer_classname_linksGrid">

            {/* ABOUT TEXT — stays static */}
            <div className="footer_classname_about">
              <Link scroll={false} href="/" title='home'>
                <img className="footer_logo" src="/logo.svg" alt="Nahara Logo" title='logo' />
              </Link>
              <p className=" footer_about text-base thin">
                Nahara brings a bold, playful edge to modern jewellery. Designed and crafted in-house, each piece blends inventive ideas with refined details, creating a fresh kind of elegance spirited, stylish, and made to stand out.
              </p>
            </div>

            {/* DYNAMIC COLUMNS */}
            {footerLinksData.map((col, index) => (
              <div className="footer_classname_column" key={index}>
                <p className="footer_classname_heading text-lg uppercase">{col.title}</p>

                <div className="footer_links_column">
                  {col.links.map((item, idx) => (
                    <Link prefetch key={idx} href={item.href} title={item.label} scroll={false}>
                      <p className="text-base thin">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bottom Section */}
          <div className="footer_classname_bottom">
            <Link scroll={false} href="/" title='home'>
              <img className="footer_logo" src="/logo.svg" alt="Nahara Logo" title='logo' />
            </Link>
            <div className="uppercase text-xs copyright_txt">
              <p>© {currentYear} Nahara. All rights reserved.</p>
            </div>
            <div className="uppercase text-xs copyright_txt">
              <p>
                Developed by &nbsp;
                <Link href="https://www.zerrorstudios.com/" title='zerror studios' target="_blank">Zerror Studios</Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Footer;
