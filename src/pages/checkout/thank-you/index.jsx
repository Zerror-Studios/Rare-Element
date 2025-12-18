import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SeoHeader from "@/components/seo/SeoHeader";

const ThankYou = ({ meta }) => {
  const router = useRouter();
  const [time, setTime] = useState(10);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [router]);

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="status_section">
        <img
          src="/gifs/success.gif"
          alt="payment successfull"
        />
        <h2 className="uppercase  text-3xl">
          Thank You <br /> for Your Purchase !
        </h2>
        <p className="text-lg">
          Your payment has been successfully processed. We’re preparing your
          order and will send you updates soon. Thank you for shopping.
        </p>
        <p className="text-lg">
          <strong>You will be redirected to the home page in  {time}  seconds</strong>
        </p>
        <Link href="/" className="text-lg text_decoration_underline">Go Back to home page</Link>
      </div>
    </>
  );
};

export default ThankYou;

export async function getServerSideProps() {
  const meta = {
    title: "Order Successful | Thank You for Shopping at Nahara",
    description:
      "Your order has been placed successfully at Nahara. Thank you for choosing our handcrafted luxury jewellery. A confirmation has been sent to your email.",
    keywords: [
      "Nahara order success",
      "thank you page",
      "order confirmation",
      "Nahara jewellery purchase"
    ],
    primaryKeywords: ["order success", "thank you"],
    author: "Nahara",
    robots: "noindex,nofollow",
    og: {
      title: "Order Confirmed | Thank You – Nahara",
      description:
        "Thank you for your purchase! Your order has been successfully placed at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Order Successful | Thank You – Nahara",
      description:
        "Your order has been placed successfully. Thank you for choosing Nahara.",
    }
  };

  return { props: { meta } };
}
