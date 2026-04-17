"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as fpixel from "@/lib/fpixel";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fpixel.pageview();
  }, [pathname, searchParams]);

  return null;
}
