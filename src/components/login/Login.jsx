import React, { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";

const Login = ({ setToggle }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="left-two">
      <div className="login-inner">
        <div className="login-t text-3xl">
          <p>
            LOGIN
          </p>
        </div>

        <form className="login-form">
          <div className="inp-rel">
            <input
              className="login-inp text-lg"
              placeholder="Email"
              type="email"
              required
            />
          </div>

          <div className="pass-cont inp-rel">
            <div
              className="eye-cont flex-all"
              onClick={() => setVisible(!visible)}
            >
              {visible ? <RiEyeLine size={20} /> : <RiEyeOffLine size={20} />}
            </div>
            <input
              className="login-inp text-lg"
              type={visible ? "text" : "password"}
              placeholder="Password"
              required
            />
          </div>

         <GreenBoxBtn text={"Login"} />
        </form>

        <div className="not-up">
          <p>
            Not a member yet?{" "}
            <span onClick={() => setToggle(true)}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
