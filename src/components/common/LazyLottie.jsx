"use client";

/**
 * Lazy Lottie (PRD-002 SF-17)
 *
 * The footer is on every page, so `lottie-react` and the animation JSON
 * (served from `/public`) load only in the browser, once the element is
 * near the viewport. Props (`lottieRef`, `autoplay`, `loop`, …) pass
 * through to `lottie-react`.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const VIEWPORT_MARGIN = "200px";
const animationCache = new Map();

const loadAnimation = (src) => {
  if (!animationCache.has(src)) {
    animationCache.set(
      src,
      fetch(src)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
    );
  }
  return animationCache.get(src);
};

const LazyLottie = ({ src, ...props }) => {
  const holderRef = useRef(null);
  const [isNear, setIsNear] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || typeof IntersectionObserver === "undefined") {
      setIsNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: VIEWPORT_MARGIN },
    );
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNear || !src) return;
    let active = true;
    loadAnimation(src).then((data) => {
      if (active) setAnimationData(data);
    });
    return () => {
      active = false;
    };
  }, [isNear, src]);

  return (
    <div ref={holderRef}>
      {animationData && <Lottie animationData={animationData} {...props} />}
    </div>
  );
};

export default LazyLottie;
