import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroller() {
  const lenis = useRef(null);

  useEffect(() => {
    if (window.innerWidth < 1024) return

    if (typeof window === "undefined") return;

    const instance = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: true,
      direction: "vertical",
      gestureDirection: "vertical",
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenis.current = instance;
    window.lenis = instance;

    let frame;
    const raf = (time) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const handleResize = () => instance.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  return null;
}
