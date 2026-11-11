"use client";

/**
 * Lazy Lottie (PRD-002 SF-17)
 *
 * The footer is on every page, so `lottie-react` and the animation JSON
 * (served from `/public`) load only in the browser, once the element is
 * near the viewport.
 *
 * `lottie-react` 3 has only named exports (`Lottie`; a default import gave
 * React error #306 on every page whose footer was in view) and a new API:
 * the animation goes in `src`, events in `subscriptions`, and its handle has
 * `play` / `pause` / `stop`. This adapter keeps the footer's props:
 * `lottieRef.current.goToAndPlay()` restarts the animation and `onDOMLoaded`
 * runs when it is ready; `autoplay`, `loop` and the rest pass through.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

const Lottie = dynamic(
  () => import("lottie-react").then((module) => module.Lottie),
  { ssr: false },
);

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

const LazyLottie = ({ src, lottieRef, onDOMLoaded, ...props }) => {
  const holderRef = useRef(null);
  const handleRef = useRef(null);
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

  // The footer's handle: goToAndPlay(0) restarts (v3 has stop + play)
  useEffect(() => {
    if (!lottieRef) return undefined;
    lottieRef.current = {
      goToAndPlay: () => {
        handleRef.current?.stop?.();
        handleRef.current?.play?.();
      },
      play: () => handleRef.current?.play?.(),
      pause: () => handleRef.current?.pause?.(),
      stop: () => handleRef.current?.stop?.(),
    };
    return () => {
      lottieRef.current = null;
    };
  }, [lottieRef]);

  const subscriptions = useMemo(
    () => (onDOMLoaded ? { ready: onDOMLoaded } : undefined),
    [onDOMLoaded],
  );

  return (
    <div ref={holderRef}>
      {animationData && (
        <Lottie
          src={animationData}
          lottieRef={handleRef}
          subscriptions={subscriptions}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyLottie;
