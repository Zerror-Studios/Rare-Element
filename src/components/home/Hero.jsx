import { useGSAP } from '@gsap/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import WhiteBorderBtn from '../buttons/WhiteBorderBtn'
gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const pathname = usePathname()
  const videoRef = useRef(null);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  // Force iOS-required attributes
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("preload", "auto");

  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;
  video.controls = false;

  const tryPlay = () => {
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {});
    }
  };

  // iOS needs metadata before autoplay
  video.addEventListener("loadedmetadata", tryPlay);

  // Fallback for older iOS
  setTimeout(tryPlay, 100);

  return () => {
    video.removeEventListener("loadedmetadata", tryPlay);
  };
}, []);




  useEffect(() => {
    var height

    if (window.innerWidth > 750) {
      height = "72vh"
    } else {
      height = "45rem"
    }

    gsap.to(".home_hero", {
      delay: 1.5,
      height: height,
      duration: 1,
      ease: "ease-secondary"
    })
    gsap.to(".info_header", {
      opacity: 1,
      delay: 1.4,
      duration: 1,
      ease: "ease-secondary"
    })
    gsap.set(".home_hero_inner, .category_header", {
      opacity: 0
    })
    gsap.to(".home_hero_inner, .category_header, .home_category_paren, .whatsapp_chat", {
      opacity: 1,
      delay: 2,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
    gsap.to(".introloader_paren", {
      opacity: 0,
      delay: 1.5,
      duration: .5,
      ease: "ease-secondary"
    })


  }, [pathname])

  return (
    <>

      <div className="introloader_paren  center">
        <div className="loader_img">
          <img src="/green_logo.svg" alt="Logo" />
        </div>
      </div>

      {pathname === "/" && (
        <div className="info_header center">
          <p className='text-xs'> Free Shipping on all orders </p>
        </div>
      )}
      <div className="dummy_hero_div"></div>
      <div className="home_hero">
        <video
          ref={videoRef}
          className="home_hero_video cover"
          src="/videos/hero_video.mp4"
          muted
          playsInline
          preload="auto"
          loop
          autoPlay
        />
        <div className="home_hero_inner">
          <h2 className='text-3xl'>World of Nahara</h2>
          <Link scroll={false} href="/products">
            <WhiteBorderBtn text={"Discover"} />
          </Link>
        </div>
      </div>
    </>
  )
}

export default Hero