import React, {
  useLayoutEffect,
  useRef,
  useEffect,
  memo
} from 'react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Link from 'next/link';
import WhiteBorderBtn from '../buttons/WhiteBorderBtn';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const innerRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
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

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion)').matches) {
      return;
    }
    if (!heroRef.current) return;

    const height =
      window.innerWidth > 750 ? '72vh' : '45rem';

    // Initial states
    gsap.set(innerRef.current, { opacity: 0 });
    gsap.set(infoRef.current, { opacity: 0 });

    const tl = gsap.timeline();

    tl.to(heroRef.current, {
      height,
      duration: 1,
      ease: 'power2.out',
    })
      .to(
        infoRef.current,
        {
          opacity: 1,
          duration: 0.6,
        },
        '-=0.4'
      )
      .to(
        innerRef.current,
        {
          opacity: 1,
          duration: 0.8,
        },
        '-=0.2'
      );

    return () => tl.kill();
  }, []);

  return (
    <>
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
          src="/videos/hero_video.mp4"
          poster="/images/homepage/hero_poster.png"
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
