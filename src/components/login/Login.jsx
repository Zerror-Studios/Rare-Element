import React, { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
import { useLazyQuery } from "@apollo/client/react";
import { LOGIN_USER } from "@/graphql";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { AuthCookies } from "@/utils/AuthCookies";

// Schema validation
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});


const Login = ({ setToggle }) => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { setUser, setIsLoggedIn } = useAuthStore((state) => state);
  const [loginUser, { loading }] = useLazyQuery(LOGIN_USER, { fetchPolicy: "network-only" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });


  const onSubmit = async (formData) => {
    try {
      const { data } = await loginUser({ variables: formData });
      const { user, userToken } = data?.userLogin || {};
      if (userToken && user) {
        localStorage.removeItem("visitorId");
        localStorage.removeItem("visitorExpire");
        AuthCookies.remove(); // clear previous
        AuthCookies.set(userToken);
        setUser(user);
        setIsLoggedIn(true);
        toast.success("Login successful!");
        router.back();
      } else {
        toast.error("Invalid login credentials.");
      }
    } catch (err) {
      // console.error("Login error:", err);
      toast.error("Invalid login credentials.");
    }
  };

  return (
    <div className="left-two">
      <div className="login-inner">
        <div className="login-t text-3xl">
          <p>
            LOGIN
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="inp-rel">
            <input
              className="login-inp text-lg"
              placeholder="Email"
              type="email"
              required
              {...register("email")}
            />
            {errors?.email && (
              <div className="error-p">{errors?.email?.message || ""}</div>
            )}
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
              {...register("password")}
            />
            {errors?.password && (
              <div className="error-p">{errors?.password?.message || ""}</div>
            )}
          </div>

          <GreenBoxBtn title={"Login"} loading={loading} />
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
