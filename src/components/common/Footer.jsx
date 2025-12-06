import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import React, { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Lottie from 'lottie-react';
import SecureLock from "../../../public/icons/animationJson/SecureLock.json";
import FreeShipping from "../../../public/icons/animationJson/FreeShipping.json";
import ChatSupport from "../../../public/icons/animationJson/ChatSupport.json";
import StoresRetail from "../../../public/icons/animationJson/StoresRetail.json";
import StretchArrow from "../../../public/icons/animationJson/StretchArrow.json";
import Link from 'next/link';


gsap.registerPlugin(ScrollTrigger)

export const featureData = [
  {
    title: "Secure Payment",
    img: "/icons/lock.svg",
    animationData: SecureLock,
    desc: "Your transactions are encrypted and fully protected for safe checkout.",
  },
  {
    title: "Free Shipping",
    img: "/icons/shipping.svg",
    animationData: FreeShipping,
    desc: "Enjoy complimentary shipping on all domestic orders with no minimum spend.",
  },
  {
    title: "Store & Retail",
    img: "/icons/store.svg",
    animationData: StoresRetail,
    desc: "Visit our boutique stores for an exclusive hands-on shopping experience.",
  },
  {
    title: "Chat Support",
    img: "/icons/chat.svg",
    animationData: ChatSupport,
    desc: "Need help? Our support team is available 24/7 to assist you instantly.",
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
      { label: "Rings", href: "/rings" },
      { label: "Earings", href: "/earings" },
      { label: "Bracelet", href: "/bracelets" },
      { label: "Necklace", href: "/necklaces" },
      { label: "Anklets", href: "/anklets" },
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
      { label: "Instagram", href: "https://instagram.com" },
      { label: "WhatsApp", href: "https://wa.me/0000000000" },
      { label: "contact@nahara.co.in", href: "https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs" },
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
              <div
                key={i}
                onMouseEnter={() => {
                  mainRef.current?.goToAndPlay(0, true);
                  arrowRef.current?.goToAndPlay(0, true);
                }}
                className="footer_classname_featureCard"
              >
                <div className="featured_icon">
                  <Lottie
                    lottieRef={mainRef}
                    animationData={item?.animationData}
                    autoplay={false}
                    loop={false}
                  />
                </div>

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
              </div>
            );
          })}

        </div>
        <div className="footer_below">

          {/* Footer Links Section */}
          <div className="footer_classname_linksGrid">

            {/* ABOUT TEXT — stays static */}
            <div className="footer_classname_about">
              <Link scroll={false} href="/">
                <img className="footer_logo" src="/logo.svg" alt="Nahara Logo" />
              </Link>
              <p className=" footer_about text-base thin">
                Nahara is where timeless design meets modern craftsmanship — every piece a statement of individuality.
              </p>
            </div>

            {/* DYNAMIC COLUMNS */}
            {footerLinksData.map((col, index) => (
              <div className="footer_classname_column" key={index}>
                <p className="footer_classname_heading text-lg uppercase">{col.title}</p>

                <div className="footer_links_column">
                  {col.links.map((item, idx) => (
                    <Link key={idx} href={item.href} scroll={false}>
                      <p className="text-base thin">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bottom Section */}
          <div className="footer_classname_bottom">
            <Link scroll={false} href="/">
              <img className="footer_logo" src="/logo.svg" alt="Nahara Logo" />
            </Link>
            <div className="uppercase text-xs copyright_txt">
              <p>© {currentYear} Nahara. All rights reserved.</p>
            </div>
            <div className="uppercase text-xs copyright_txt">
              <p>
                Developed by &nbsp;
                <a href="https://www.zerrorstudios.com/" target="_blank">Zerror Studios</a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Footer;
