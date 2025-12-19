import "../styles/globals.css";
import "../styles/allCssImport.css";
import LenisScroll from "@/components/common/LenisScroll";
import Layout from "@/components/layouts/Layout";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import gsap from "gsap";
import PageTransition from "@/components/common/PageTransition";
import { ToastContainer } from "react-toastify";
import { ApolloProvider } from "@apollo/client/react";
import { createApolloClient } from "@/lib/apolloClient";
import { AuthProvider } from "@/context/AuthContext";
gsap.registerPlugin(ScrollTrigger);

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const client = createApolloClient();

  useEffect(() => {
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
      if (window.lenis) window.lenis.resize();
    }, 500);
    return () => clearTimeout(timeout);
  }, [router.asPath]);
  

  return (
    <>
      <ApolloProvider client={client}>
        <AuthProvider>
          <LenisScroll />
          <PageTransition routeKey={router.asPath}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </PageTransition>
        </AuthProvider>
        <ToastContainer position="top-right" />
      </ApolloProvider>
    </>
  );
}
