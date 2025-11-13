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

const Footer = () => {

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
            <div className="footer_classname_about">
              <p className='text-base thin'>
                Nahara is where timeless design meets modern craftsmanship — every piece a statement of individuality.
              </p>
            </div>

            <div className="footer_classname_column">
              <p className="footer_classname_heading text-lg uppercase">Category</p>
              <div className='footer_links_column' >
                <p className='text-base thin' >Rings</p>
                <p className='text-base thin' >Earrings</p>
                <p className='text-base thin' >Bracelet</p>
                <p className='text-base thin' >Necklace</p>
                <p className='text-base thin' >Anklets</p>
              </div>
            </div>

            <div className="footer_classname_column">
              <p className="footer_classname_heading text-lg uppercase">Brand</p>
              <div className='footer_links_column' >
                <p className='text-base thin' >Home</p>
                <p className='text-base thin' >Shop</p>
                <p className='text-base thin' >About Nahara</p>
              </div>
            </div>

            <div className="footer_classname_column">
              <p className="footer_classname_heading text-lg uppercase">Support</p>
              <div className='footer_links_column' >
                <p className='text-base thin' >Shipping & Returns</p>
                <p className='text-base thin' >FAQs</p>
                <p className='text-base thin' >Care Guide</p>
              </div>
            </div>

            <div className="footer_classname_column">
              <p className="footer_classname_heading text-lg uppercase">Contact Us</p>
              <div className='footer_links_column' >
                <p className='text-base thin' >hello@rareelement.in</p>
                <p className='text-base thin' >Instagram</p>
                <p className='text-base thin' >WhatsApp</p>
              </div>
            </div>
          </div>

          {/* Footer Bottom Section */}
          <div className="footer_classname_bottom">
            <Link scroll={false} href="/">
              <img className='footer_logo' src="/logo.svg" alt="Nahara Logo" />
            </Link>
            <div className='uppercase  text-xs copyright_txt'>
              <p>
                © 2025 Nahara. All rights reserved. Developed by
              </p>
              <a href="https://www.zerrorstudios.com/" target='_blank' > Zerror Studios</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
