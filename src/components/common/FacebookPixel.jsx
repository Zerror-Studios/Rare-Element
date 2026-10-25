"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as fpixel from "@/lib/fpixel";

// The base code in layout.jsx inits the Pixel and tracks the first
// PageView; this tracks client-side navigations only (SF-22: no double).
export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fpixel.pageview();
  }, [pathname, searchParams]);

  return null;
}
