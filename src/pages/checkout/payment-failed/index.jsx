import React from "react";
import Link from "next/link";
import SeoHeader from "@/components/seo/SeoHeader";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

const PaymentFailed = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div className="status_section center">
        <div className="status_section_inner">
          <div className="status_img_pren center">
            <img className="cover" src="/gifs/payment_failed.webp" alt="" />
          </div>
            <h2 className="text-3xl">Payment Failed</h2>
            <p className="uppercase">Unfortunately, your payment could not be processed.</p>
            <p></p>
            <p>Have Question? Contact Us at: </p>
            <a className="text_decoration_underline" target="_blank" href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs">contact@nahara.co.in</a>
            <div className="w-full">
            <GreenBoxBtn title="Continue Shopping" href="/" />
            </div>
        </div>
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
