"use client";

import React from "react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"

const Signout = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const handleSignout = async () => {
    await logout();
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