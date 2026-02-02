import React, { useState } from "react";
import SeoHeader from "@/components/seo/SeoHeader";
import Login from "@/components/login/Login";
import Signup from "@/components/login/Signup";

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
            <img
              src="https://palmonas.com/cdn/shop/files/BR093-B_b2505079-b550-4521-8d72-32af352050af.jpg?v=1744526386&width=900"
              alt="image"
              title="img"
            />
          </div>
          <div className="left-one">
            <img
              src="https://www.apm.mc/cdn/shop/files/AB5616OX-apm-monaco-pave-bracelet-jewelry_6406ed76-f49c-44d3-95ba-7e51e631a327.jpg?v=1755764670&width=600"
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
