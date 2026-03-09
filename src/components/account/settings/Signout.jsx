"use client";

import React from "react"
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { AuthCookies } from "@/utils/AuthCookies"

const Signout = () => {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const handleSignout = () => {
    AuthCookies.remove();
    clearAuth();
    localStorage.clear();
    router.replace("/");
  }
  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__link" onClick={handleSignout}>
        <p>Sign out</p>
      </div>

    </>
  )
}

export default Signout