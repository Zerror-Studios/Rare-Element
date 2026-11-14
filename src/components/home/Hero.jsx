"use client";

import React, {
  useEffect,
  useRef,
  memo
} from 'react';

import Link from 'next/link';
import WhiteBorderBtn from '../buttons/WhiteBorderBtn';
import Image from 'next/image';
import { preload } from 'react-dom';

const HERO_VIDEO_SRC = '/videos/hero_video.webm';
const HERO_POSTER_SRC = '/images/homepage/heroPoster.webp';

const Hero = () => {
  // The poster is the first screen. Called here, in a client component, the
  // hint is only in the home page's HTML (a server-page preload travelled
  // with the home page's prefetch into every page).
  preload(HERO_POSTER_SRC, { as: 'image', fetchPriority: 'high' });
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const innerRef = useRef(null);
  const infoRef = useRef(null);

  // The poster is the first screen; the 3 MB video is attached only after
  // the page has loaded, so it never competes with the first paint (LCP).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const start = () => {
      if (!video.getAttribute('src')) video.setAttribute('src', HERO_VIDEO_SRC);
      video.play().catch(() => { });
    };
    if (document.readyState === 'complete') {
      start();
      return undefined;
    }
    window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);

  // The reveal (hero clip, info bar, loader fade) runs in CSS
  // (styles/components/home/hero.css), so the first screen paints without
  // waiting for JavaScript (LCP); reduced motion shows the final state.

  return (
    <>

      <div className="introloader_paren hero_introloader center">
        <div className="loader_img">
          {/* The intro logo is the first screen's largest paint (LCP) */}
          <Image sizes="(max-width: 750px) 50vw, 25vw" src="/green_logo.svg" alt="Nahara Loading Logo" width={400} height={400} preload fetchPriority="high"
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
          poster={HERO_POSTER_SRC}
          muted
          playsInline
          loop
          preload="none"
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
