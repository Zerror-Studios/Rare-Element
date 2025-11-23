import React from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'
import OrderSummaryBox from './OrderSummaryBox'

const AmountTotalBox = ({ user, setQuantity, quantity }) => {
    return (
        <>
            <div className="checkout_summaryWrapper">
                <OrderSummaryBox user={user} quantity={quantity} setQuantity={setQuantity} />

                <div className="coupon_div">
                    <input type="text" placeholder="Discount Code" className="checkout_couponInput" />
                    <div className="checkout_couponBtn text-base uppercase">
                        <GreenBoxBtn text={"Apply"} />
                    </div>
                </div>

                <div className="checkout_row ">
                    <p className="checkout_textBase text-lg uppercase">Subtotal</p>
                    <p className="checkout_textBase text-lg uppercase">₹ {quantity * 999}</p>
                </div>

                <div className="checkout_borderRow ">
                    <p className="checkout_textSm text-lg uppercase">Shipping Charge</p>
                    <p className="checkout_textSm text-lg uppercase">₹ 50</p>
                </div>

                <div className="checkout_row semibold uppercase text-2xl">
                    <p className="checkout_subtotalText bold">Total</p>
                    <p className="checkout_subtotalValue bold">₹ {(quantity * 999) + 50}</p>
                </div>
                
                <div className="checkout_btn text-base uppercase">
                    <GreenBoxBtn text={"Pay Now"} />
                </div>


            </div>
        </>
    )
}

export default AmountTotalBox