import React, { useState } from "react";
import SeoHeader from "@/components/seo/SeoHeader";
import Login from "@/components/login/Login";
import Signup from "@/components/login/Signup";
import Image from "next/image";

const UserLogin = ({ meta }) => {
  const [toggle, setToggle] = useState(false);
  return (
    <>
      <SeoHeader meta={meta} />
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
              title="img"
            />
          </div>
          <div className="left-one">
            <Image
              width={600}
              height={600}
              src="/images/homepage/footer_reels/rings.JPG"
              alt="image"
              title="img"
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
    </>
  );
};

export default UserLogin;

export async function getStaticProps() {
  const meta = {
    title: "Login – Access Your Nahara Jewellery Account",
    description: "Login to your Nahara account to track orders, manage information, and access exclusive offers.",
    keywords: ["Nahara login", "customer login", "jewellery account login"],
    primaryKeywords: ["Nahara login"],
    author: "Nahara",
    robots: "noindex, nofollow",
    og: {
      title: "Login – Nahara Jewellery",
      description: "Sign in to your Nahara account.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Login – Nahara Jewellery",
      description: "Access your Nahara account.",
    }
  };
  return { props: { meta } };
}
