import React from "react";
import Link from "next/link";
import SeoHeader from "@/components/seo/SeoHeader";

const PaymentFailed = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div className="status_section">
        <img
          src="/gifs/fail.gif"
          className="fail_gif"
          alt="payment failed"
        />
        <h2 className="uppercase  text-3xl">
          Payment Failed
        </h2>
        <p className="text-lg">
          Unfortunately, your payment could not be processed. Please try again
          to complete your order.
        </p>
        <Link href="/" className="text-lg text_decoration_underline">Go Back to home page</Link>
      </div>
    </>
  );
};

export default PaymentFailed;

export async function getServerSideProps() {
  const meta = {
    title: "Payment Failed | Please Try Again – Nahara",
    description:
      "Your payment could not be processed. Please retry or choose an alternative payment method to complete your Nahara jewellery order.",
    keywords: [
      "payment failed",
      "transaction error",
      "Nahara payment issue",
      "checkout error"
    ],
    primaryKeywords: ["payment failed", "transaction error"],
    author: "Nahara",
    robots: "noindex,nofollow",
    og: {
      title: "Payment Failed | Nahara",
      description:
        "Your payment could not be processed. Please try again to complete your order.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Payment Failed | Nahara",
      description:
        "Payment was unsuccessful. Please retry or use another payment method.",
    }
  };

  return { props: { meta } };
}
