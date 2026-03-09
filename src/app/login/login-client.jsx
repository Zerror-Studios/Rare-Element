"use client";

import React, { useState } from "react";
import Login from "@/components/login/Login";
import Signup from "@/components/login/Signup";
import Image from "next/image";

const LoginClient = () => {
  const [toggle, setToggle] = useState(false);
  return (
    <div className="login-cont">
      <div
        className="login-left-cont"
        style={{ transform: toggle ? "translateY(0%)" : "translateY(-50%)" }}
      >
        <div className="left-one">
          <Image
            width={600}
            height={600}
            src="/images/homepage/footer_reels/bracelet.JPG"
            alt="image"
            priority
          />
        </div>
        <div className="left-one">
          <Image
            width={600}
            height={600}
            src="/images/homepage/footer_reels/rings.JPG"
            alt="image"
          />
        </div>
      </div>
      <div
        className="login-right-cont background"
        style={{ transform: toggle ? "translateY(-50%)" : "translateY(0%)" }}
      >
        <Login setToggle={setToggle} />
        <Signup setToggle={setToggle} />
      </div>
    </div>
  );
};

export default LoginClient;
