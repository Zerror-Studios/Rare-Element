import Link from "next/link";
import React from "react";

const PaymentFailed = () => {
  return (
    <>

      <div className="status_section">
        <img
          src="/gifs/fail.gif"
          className="fail_gif"
          alt="payment failed"
        />
        <p className="uppercase bold text-3xl">
          Payment Failed
        </p>
        <p className="text-lg">
          Unfortunately, your payment could not be processed. Please try again
          to complete your order.
        </p>
        <Link href="/" className="text-lg">Go Back to home page</Link>
      </div>
    </>
  );
};

export default PaymentFailed;
