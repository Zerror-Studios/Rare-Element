import AmountTotalBox from "@/components/checkout/AmountTotalBox";
import BillingBox from "@/components/checkout/BillingBox";
import EmailBox from "@/components/checkout/EmailBox";
import OrderSummaryBox from "@/components/checkout/OrderSummaryBox";
import ShippingBox from "@/components/checkout/ShippingBox";
import React, { useState } from "react";


const Checkout = () => {
    const [quantity, setQuantity] = useState(1);

    const user = {
        email: "tiwarirohit159@gmail.com",
        phone: "+91 7039446638",
        name: "Rohit Tiwari",
        dob: "21/10/2000",
        address: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        subscriptions: {
            newsletter: "Not subscribed",
            directMail: "Subscribed",
        },
    }

    return (
        <>
            <div className="checkout_section">
                
                <p className=" text-3xl bold uppercase checkout_heading">Checkout</p>

                <div className="checkout_Wrapper">

                    <div className="checkout_leftContainer">

                        <EmailBox user={user} />

                        <ShippingBox user={user} />

                        <BillingBox user={user} />

                        <OrderSummaryBox user={user} quantity={quantity} setQuantity={setQuantity} />

                    </div>

                    <div className="checkout_summaryContainer">

                        <AmountTotalBox quantity={quantity} />

                    </div>

                </div>

            </div>

        </>
    );
};

export default Checkout;
