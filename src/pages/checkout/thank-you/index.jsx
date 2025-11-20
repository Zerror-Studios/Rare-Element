import Link from "next/link";
import React, { useState, useEffect } from "react";

const ThankYou = () => {

  return (
    <>
      <div className="status_section">
        <img
          src="/gifs/success.gif"
          alt="payment successfull"
        />
        <p className="uppercase bold text-3xl">
          Thank You <br /> for Your Purchase !
        </p>
        <p className="text-lg">
          Your payment has been successfully processed. We’re preparing your
          order and will send you updates soon. Thank you for shopping.
        </p>
        <p className="text-lg">
          You will be redirected to the home page in
          seconds
        </p>
        <Link href="/" className="text-lg">Go Back to home page</Link>
      </div>
    </>
  );
};

export default ThankYou;

