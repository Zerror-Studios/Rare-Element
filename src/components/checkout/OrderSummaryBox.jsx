import { RiDeleteBinLine } from '@remixicon/react'
import React from 'react'

const OrderSummaryBox = ({ user, quantity, setQuantity }) => {
    const increment = () => setQuantity((prev) => prev + 1);
    const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    return (
        <>
            <div className="">
                <p className="checkout_subHeading text-lg uppercase"> Order Summary</p>
                {[1, 2].map((item, index) => (
                    <div key={index} className="checkout_item">

                        <div className="checkout_imgWrapper">
                            <img
                                className="checkout_productImg"
                                src="http://localhost:3000/images/homepage/category/earings.svg"
                                alt=""
                            />
                        </div>

                        <div className="checkout_details">
                            <div className="checkout_topRow">
                                <div>
                                    <p className="checkout_productName text-lg">Product Name</p>
                                    <p className="checkout_metaText text-base ">Quantity: {quantity}</p>
                                    <p className="checkout_metaText text-base ">Size: M</p>
                                    <p className="checkout_metaText text-base ">Color: Blue</p>
                                </div>

                                <p className="checkout_price text-lg">₹ 999</p>
                            </div>

                            <div className="checkout_bottomRow">

                                <div className="checkout_quantityBox">
                                    <button onClick={decrement}><p>−</p></button>
                                    <p>{quantity}</p>
                                    <button onClick={increment}><p>+</p></button>
                                </div>

                                <button className="checkout_deleteBtn">
                                    <RiDeleteBinLine size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </>
    )
}

export default OrderSummaryBox