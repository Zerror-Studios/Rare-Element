import React from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const AmountTotalBox = ({ quantity }) => {
    return (
        <>
            <div className="checkout_summaryWrapper">
                <div className="coupon_div">
                    <input type="text" placeholder="Coupon Code" className="checkout_couponInput" />
                    <div className="checkout_couponBtn text-base uppercase">
                        <GreenBoxBtn text={"Apply"} />
                    </div>
                </div>

                <div className="checkout_row text-lg">
                    <p className="checkout_textBase">Total Charge</p>
                    <p className="checkout_textBase">₹ {quantity * 999}</p>
                </div>

                <div className="checkout_borderRow text-base">
                    <p className="checkout_textSm">Shipping Charge</p>
                    <p className="checkout_textSm">₹ 50</p>
                </div>

                <div className="checkout_row semibold text-2xl">
                    <p className="checkout_subtotalText">Subtotal</p>
                    <p className="checkout_subtotalValue">₹ {(quantity * 999) + 50}</p>
                </div>

                <div>
                    <img
                        className="checkout_paymentImg"
                        src="https://apexhearthospital.com/wp-content/uploads/2025/05/payment-logo-icons-1024x272-1.png"
                        alt=""
                    />
                    <p className="checkout_paymentNote text-sm">
                        * All payments are secured and encrypted.
                    </p>
                </div>

                <div className="checkout_btn text-base uppercase">
                    <GreenBoxBtn text={"Pay Now"} />
                </div>


            </div>
        </>
    )
}

export default AmountTotalBox