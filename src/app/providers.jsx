"use client";

import { ToastContainer, Zoom } from "react-toastify";
import Layout from "@/components/layouts/Layout";

import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { AuthProvider } from "@/context/AuthContext";
import LenisScroll from "@/components/common/LenisScroll";
import { useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { usePathname } from "next/navigation";
gsap.registerPlugin(ScrollTrigger);


export function Providers({ children }) {

  const pathname = usePathname();

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      if (window.lenis) {
        window.lenis.resize();
        lenis.scrollTo(0, { immediate: true });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <ApolloWrapper>
      <AuthProvider>
        <LenisScroll>
          <Layout>
            {children}
          </Layout>
        </LenisScroll>
        <ToastContainer
          position="top-right"
          autoClose={1500}
          transition={Zoom}
        />
      </AuthProvider>
    </ApolloWrapper>
  );
}
