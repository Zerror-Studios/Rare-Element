import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SeoHeader from "@/components/seo/SeoHeader";
import GreenBoxBtn from './../../../components/buttons/GreenBoxBtn';

const ThankYou = ({ meta }) => {

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="status_section center">
        <div className="status_section_inner">
          <div className="status_img_pren center">
            <img className="cover" src="/gifs/success.gif" alt="" />
          </div>
            <h2 className="text-3xl">Payment Successfull</h2>
            <p className="uppercase">Thank you for your purchase</p>
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
