"use client";

/**
 * Client providers (PRD-002 FR-4.1): the kit's `ZcomSsrProvider` (Apollo
 * Client 4 shared with the store's own queries, the customer session,
 * guest cart, visit attribution and click-id capture) and `ZcomTags`
 * (GA4/GTM with analytics consent, Meta Pixel and Google Ads with ads
 * consent; backend ids first, env fallback). The store keeps its layout,
 * smooth scroll and toasts.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast, ToastContainer, Zoom } from "react-toastify";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { config as zodConfig } from "zod";
import { ZcomSsrProvider } from "@zcom/storefront-kit/ssr";
import { registerNimbblCheckout, ZcomTags } from "@zcom/storefront-kit/client";

import Layout from "@/components/layouts/Layout";
import LenisScroll from "@/components/common/LenisScroll";
import { AuthProvider } from "@/context/AuthContext";
import { zcomConfig } from "@/zcom.config";

gsap.registerPlugin(ScrollTrigger);

// zod 4 probes `Function("")` once to decide whether to compile its
// validators; the CSP blocks `eval`, so the probe only logs a violation.
zodConfig({ jitless: true });

// Nimbbl until its 2026-11-15 shutdown (backend PRD-029 D1): the kit opens
// this store's Sonic for a NIMBBL checkout; the module loads only on "Pay".
registerNimbblCheckout(() => import("nimbbl_sonic").then((m) => m.default));

const STORE_UNAVAILABLE_TOAST_ID = "store-unavailable";
const TAG_ID_FALLBACK = {
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  metaPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
};

const showStoreUnavailable = () =>
  toast.error("This store isn't available right now.", {
    toastId: STORE_UNAVAILABLE_TOAST_ID,
  });

export function Providers({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      if (window.lenis) {
        window.lenis.resize();
        window.lenis.scrollTo(0, { immediate: true });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <ZcomSsrProvider config={zcomConfig} onStoreUnavailable={showStoreUnavailable}>
      <ZcomTags fallback={TAG_ID_FALLBACK} />
      <AuthProvider>
        <LenisScroll>
          <Layout>{children}</Layout>
        </LenisScroll>
        <ToastContainer position="top-right" autoClose={1500} transition={Zoom} />
      </AuthProvider>
    </ZcomSsrProvider>
  );
}
