"use client";

import React, {
  useRef,
  memo
} from 'react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Link from 'next/link';
import WhiteBorderBtn from '../buttons/WhiteBorderBtn';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const innerRef = useRef(null);
  const infoRef = useRef(null);

  useGSAP(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => { });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion)').matches) {
      return;
    }
    if (!heroRef.current) return;

    // Immediately make it visible so browser can paint it for LCP
    gsap.set(heroRef.current, { opacity: 1 });

    const tl = gsap.timeline();

    tl.to(heroRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.8,
      delay: 0.1, // Reduced from 1.5s to fix LCP/FCP
      ease: 'ease-secondary',
    })
      .to(
        infoRef.current,
        {
          opacity: 1,
          duration: 0.4,
        }, "<"
      )
      .to(
        innerRef.current,
        {
          opacity: 1,
          duration: 0.5,
        },
      )
      .to(".introloader_paren", {
        opacity: 0,
        display: "none",
        duration: 0.3
      }, "<")

    return () => tl.kill();
  });

  return (
    <>

      <div className="introloader_paren center">
        <div className="loader_img">
          <Image src="/green_logo.svg" alt="Nahara Loading Logo" width={400} height={400}
          //  sizes="(max-width: 768px) 80vw, 400px"
            />
        </div>
      </div>

      {/* Info Bar */}
      <div
        ref={infoRef}
        className="info_header center"
      >
        <p className="text-xs">
          Free Shipping on all orders
        </p>
      </div>

      <div className="dummy_hero_div" />

      {/* Hero */}
      <div
        ref={heroRef}
        className="home_hero"
      >
        <video
          ref={videoRef}
          className="home_hero_video cover"
          src="/videos/hero_video.webm"
          poster="/images/homepage/hero_poster.webp"
          muted
          playsInline
          loop
          preload="metadata"
        />

        <div
          ref={innerRef}
          className="home_hero_inner"
        >
          <h1 className="text-3xl">
            World of Nahara
          </h1>

          <Link scroll={false} href="/products">
            <WhiteBorderBtn text="Discover" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default memo(Hero);
