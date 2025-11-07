import "../styles/globals.css";
import "../styles/allCssImport.css";
import LenisScroll from "@/components/common/LenisScroll";
import Layout from "@/components/layouts/Layout";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import gsap from "gsap";
gsap.registerPlugin(ScrollTrigger);

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
      if (window.lenis) window.lenis.resize();
    }, 500);
    return () => clearTimeout(timeout);
  }, [router.asPath]);
  
  return (
    <>
      <LenisScroll />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
