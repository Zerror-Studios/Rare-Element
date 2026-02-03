import "../styles/globals.css";
import "../styles/allCssImport.css";

import React, { useEffect } from "react";
import { useRouter } from "next/router";

import LenisScroll from "@/components/common/LenisScroll";
import Layout from "@/components/layouts/Layout";
import PageTransition from "@/components/common/PageTransition";
import RouteLoader from "@/components/common/RouteLoader";

import ScrollTrigger from "gsap/dist/ScrollTrigger";
import gsap from "gsap";

import { ToastContainer, Zoom } from "react-toastify";
import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@/lib/apolloClient";
import { AuthProvider } from "@/context/AuthContext";

import { useRouteLoaderStore } from "@/store/useRouteLoader-store";

gsap.registerPlugin(ScrollTrigger);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const client = createApolloClient();

  const start = useRouteLoaderStore((s) => s.start);
  const stop = useRouteLoaderStore((s) => s.stop);

  useEffect(() => {
    const handleStart = (url, { shallow }) => {
      if (!shallow) start();
    };

    const handleStop = () => stop();

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router.events, start, stop]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      window.lenis?.resize();
    });
  }, [router.asPath]);

  return (
    <>
      <RouteLoader />

      <ApolloProvider client={client}>
        <AuthProvider>
          <LenisScroll />

          <PageTransition routeKey={router.asPath}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </PageTransition>
        </AuthProvider>

        <ToastContainer
          position="top-right"
          autoClose={1500}
          transition={Zoom}
        />
      </ApolloProvider>
    </>
  );
}
