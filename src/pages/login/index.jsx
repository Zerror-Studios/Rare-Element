import React, { useState } from "react";
import Image from "next/image";
import Login from "@/components/login/Login";
import Signup from "@/components/login/Signup";

const UserLogin = ({ meta }) => {
  const [toggle, setToggle] = useState(false);
  return (
    <>
      <div className="login-cont">
        <div
          className="login-left-cont"
          style={{ transform: toggle ? "translateY(0%)" : "translateY(-50%)" }}
        >
          <div className="left-one">
            <img
              src="https://palmonas.com/cdn/shop/files/BR093-B_b2505079-b550-4521-8d72-32af352050af.jpg?v=1744526386&width=900"
              alt="image"
            />
          </div>
          <div className="left-one">
            <img
              src="https://www.apm.mc/cdn/shop/files/AB5616OX-apm-monaco-pave-bracelet-jewelry_6406ed76-f49c-44d3-95ba-7e51e631a327.jpg?v=1755764670&width=600"
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
    </>
  );
};

export default UserLogin;
