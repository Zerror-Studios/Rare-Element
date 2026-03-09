"use client";

import { ToastContainer, Zoom } from "react-toastify";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Layout from "@/components/layouts/Layout";

const ApolloWrapper = dynamic(() => import("@/lib/apollo-wrapper").then(mod => mod.ApolloWrapper), { ssr: false });
const AuthProvider = dynamic(() => import("@/context/AuthContext").then(mod => mod.AuthProvider), { ssr: false });
const LenisScroll = dynamic(() => import("@/components/common/LenisScroll"), { ssr: false });

export function Providers({ children }) {
  const pathname = usePathname();

  return (
    <ApolloWrapper>
      <AuthProvider>
        <LenisScroll />
        <Layout>
          {children}
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={1500}
          transition={Zoom}
        />
      </AuthProvider>
    </ApolloWrapper>
  );
}
