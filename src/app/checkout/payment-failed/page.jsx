import React from "react";
import Link from "next/link";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import Image from "next/image";

export const metadata = {
  title: "Payment Failed | Please Try Again – Nahara",
  description: "Your payment could not be processed. Please retry or choose an alternative payment method to complete your Nahara jewellery order.",
  keywords: ["payment failed", "transaction error", "Nahara payment issue", "checkout error"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <div className="status_img_pren center">
          <Image height={200} width={200} className="cover" src="/gifs/payment_failed.webp" alt="error gif" />
        </div>
        <h1 className="text-3xl font-bold text-red-600">Payment Failed</h1>
        <p className="uppercase mt-2">Unfortunately, your payment could not be processed.</p>
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline text-blue-600 block mt-1" target="_blank" href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs">contact@nahara.co.in</Link>
        <div className="w-full mt-8">
          <GreenBoxBtn title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
}
