import React from "react";
import Link from "next/link";
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import Image from "next/image";
import PurchaseTracker from "@/components/checkout/PurchaseTracker";

export const metadata = {
  title: "Order Successful | Thank You for Shopping at Nahara",
  description: "Your order has been placed successfully at Nahara. Thank you for choosing our handcrafted luxury jewellery. A confirmation has been sent to your email.",
  keywords: ["Nahara order success", "thank you page", "order confirmation", "Nahara jewellery purchase"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <div className="status_section center">
      <PurchaseTracker />
      <div className="status_section_inner">
        <div className="status_img_pren center">
          <Image height={200} width={200} className="cover" src="/gifs/success.gif" alt="success gif" />
        </div>
        <h1 className="text-3xl font-bold">Payment Successful</h1>
        <p className="uppercase mt-2">Thank you for your purchase</p>
        <p className="mt-4">Have Question? Contact Us at: </p>
        <Link className="underline text-blue-600 block mt-1" target="_blank" href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs">contact@nahara.co.in</Link>
        <div className="w-full mt-8">
          <GreenBoxBtn title="Continue Shopping" href="/" />
        </div>
      </div>
    </div>
  );
}
