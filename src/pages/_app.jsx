import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import Layout from "@/components/layouts/Layout";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useRouter } from "next/router";
import { ToastContainer, Zoom } from "react-toastify";
import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@/lib/apolloClient";
import { AuthProvider } from "@/context/AuthContext";

const LenisScroll = dynamic(() => import("@/components/common/LenisScroll"), { ssr: false });
// const PageTransition = dynamic(() => import("@/components/common/PageTransition"), { ssr: false });
// const RouteLoader = dynamic(() => import("@/components/common/RouteLoader"), { ssr: false });


import "../styles/globals.css";
import "../styles/allCssImport.css";

gsap.registerPlugin(ScrollTrigger);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const client = createApolloClient(pageProps.initialApolloState);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url, { shallow }) => {
      if (!shallow) {
        setIsLoading(true);
      }
    };

    const handleStop = () => setIsLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      window.lenis?.resize();
    });
  }, [router.asPath]);

  return (
    <>
      {/* {!isAccountPath(router.pathname) && <RouteLoader />} */}

      <ApolloProvider client={client}>
        <AuthProvider>
          <LenisScroll />

          {/* <PageTransition routeKey={router.asPath}> */}
          <Layout>
            {/* <RouteLoader isLoading={isLoading} /> */}
            <Component {...pageProps} />
          </Layout>
          {/* </PageTransition> */}
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
