import { ProductsData } from '@/utils/ProductsData';
import { RiDeleteBinLine } from '@remixicon/react'
import Link from 'next/link';
import React from 'react'

const OrderSummaryBox = ({ user, quantity, setQuantity }) => {

    const increment = () => setQuantity((prev) => prev + 1);
    const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

    return (
        <>
            <div className="">
                <p className="checkout_subHeading text-lg uppercase"> Order Summary (2)</p>
                <div className="summary_products_paren">
                    {ProductsData.slice(0, 2).map((item, index) => (
                        <div key={index} className="checkout_item">
                            <div className="checkout_imgWrapper">
                                <Link href={`/products/${item.slug}`} >
                                    <img
                                        className="checkout_productImg"
                                        src={item.hoverImage}
                                        alt=""
                                    />
                                </Link>
                            </div>

                            <div className="checkout_details">
                                <div className="checkout_topRow">
                                    <div>
                                        <p className="checkout_productName text-base">{item.title}</p>
                                        <p className="checkout_metaText text-xs ">Color - Gold</p>
                                        <p className="checkout_metaText text-xs ">Size -  14</p>
                                        <p className="checkout_metaText text-xs ">Quantity: {quantity}</p>
                                    </div>

                                    <p className="checkout_price text-base">₹ {item.price}</p>
                                </div>

                                <div className="cartBag_bagItemBottom">
                                    <div className="cartBag_qtyControl text-lg">
                                        <div className="cartBag_qtyControl_dec">
                                            <p>−</p>
                                        </div>
                                        <p>1</p>
                                        <div className="cartBag_qtyControl_inc">
                                            <p>+</p>
                                        </div>
                                    </div>
                                    <div className="cartBag_removeButton">
                                        <RiDeleteBinLine size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </>
    )
}

export default OrderSummaryBox