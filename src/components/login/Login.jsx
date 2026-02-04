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
import { TokenManager } from "@/utils/tokenManager";

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
      const { user, accessToken, refreshToken } = data?.userLogin || {};
      if (accessToken && refreshToken && user) {
        localStorage.removeItem("visitorId");
        localStorage.removeItem("visitorExpire");
        TokenManager.clearTokens(); // clear previous
        TokenManager.setTokens(accessToken, refreshToken);
        setUser(user);
        setIsLoggedIn(true);
        toast.success("Login successful!");
        router.back();
      } else {
        toast.error("Invalid login credentials.");
      }
    } catch (err) {
      // console.error(err);
      if (err.message === 'Error in Save user for client: Nahara for Error "User not found!!"') {
        toast.error("User not found with this email.");
      } else {
        toast.error("Incorrect password.");
      }
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
              <div className="error-p">
                <p>
                  {errors?.email?.message || ""}
                </p>
              </div>
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
              <div className="error-p">
                <p>
                  {errors?.password?.message || ""}
                </p>
              </div>
            )}
          </div>
          <div className="signup_btn">
            <GreenBoxBtn title={"Login"} loading={loading} />
          </div>
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
