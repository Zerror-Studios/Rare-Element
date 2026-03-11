"use client";

import { ToastContainer, Zoom } from "react-toastify";
import Layout from "@/components/layouts/Layout";

import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { AuthProvider } from "@/context/AuthContext";
import LenisScroll from "@/components/common/LenisScroll";

export function Providers({ children }) {

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
