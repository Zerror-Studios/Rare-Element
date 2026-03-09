import LoginClient from './login-client'

export const metadata = {
  title: "Login – Access Your Nahara Jewellery Account",
  description: "Login to your Nahara account to track orders, manage information, and access exclusive offers.",
  keywords: ["Nahara login", "customer login", "jewellery account login"],
  robots: "noindex, nofollow",
};

export default function Page() {
  return <LoginClient />;
}
