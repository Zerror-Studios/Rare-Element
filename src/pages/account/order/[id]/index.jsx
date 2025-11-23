import React from 'react';
import AccountLeftSlide from '@/components/account/AccountLeftSlide';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RiArrowRightSLine, RiDeleteBinLine } from '@remixicon/react';

const orders = [
    {
        id: "42027098022",
        status: "Delivered",
        userName: "Sunny Kurmi",
        userEmail: "sunny@gmail.com",
        orderDate: "28/05/2025",
        deliveryDate: "31/05/2025",
        Totalamount: "2,798",
        paymentMethod: "Credit/Debit Card",
        billingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        shippingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        items: [
            {
                id: 1,
                title: "Product 1",
                image: "https://www.buccellati.com/media/catalog/product/cache/f32ea68c9c107d6f3a07ad7e3694ba92/J/A/JAUEAR023731_V1xxl_2.png",
                price: "1,000",
                quantity: 2,
            },
            {
                id: 2,
                title: "Product 2",
                image: "https://www.buccellati.com/media/catalog/product/cache/f32ea68c9c107d6f3a07ad7e3694ba92/J/A/JAUNEC023365_V1xxl_2.png",
                price: "1,800",
                quantity: 2,
            },
        ],
    },
    {
        id: "42027098023",
        status: "Delivered",
        userName: "Sunny Kurmi",
        userEmail: "sunny@gmail.com",
        orderDate: "28/05/2025",
        deliveryDate: "31/05/2025",
        Totalamount: "2,798",
        paymentMethod: "Credit/Debit Card",
        billingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        shippingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        billingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        shippingAddress: {
            line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
            line2: "400050, Mumbai",
            country: "India",
        },
        items: [
            {
                id: 1,
                title: "Product 1",
                image: "https://www.buccellati.com/media/catalog/product/cache/f32ea68c9c107d6f3a07ad7e3694ba92/J/A/JAUPEN022829_V1xxl_2.png",
                price: "1,000",
                quantity: 2,
            },
            {
                id: 2,
                title: "Product 2",
                image: "https://www.buccellati.com/media/catalog/product/cache/f32ea68c9c107d6f3a07ad7e3694ba92/J/A/JAUEAR004578_V1xxl_2.png",
                price: "1,800",
                quantity: 2,
            },
            {
                id: 3,
                title: "Product 3",
                image: "https://palmonas.com/cdn/shop/files/BR093-B_b2505079-b550-4521-8d72-32af352050af.jpg?v=1744526386&width=900",
                price: "1,800",
                quantity: 2,
            },
            {
                id: 4,
                title: "Product 4",
                image: "https://palmonas.com/cdn/shop/files/BR093-RG_1ecf6e0a-8c78-4a57-8726-b3f3e7524a9b.jpg?v=1744526386&width=900",
                price: "1,800",
                quantity: 2,
            },
        ],
    },
]

const OrderDetail = () => {

    const id = useParams();
    const order = orders.find((order) => order.id === id?.id);

    return (
        <div>
            <div className="account_wrapper">
                <div className="settings__left">
                    <AccountLeftSlide />
                </div>
                <div className="settings__breadcrumb">
                    <Link scroll={false} href={"/orders"}>
                        <p className="settings__breadcrumb_faded text-sm">Orders</p>
                    </Link>
                    <RiArrowRightSLine size={14} />
                    <p className='text-sm'>order details</p>
                </div>

                <div className="account_rightSection">

                    <h2 className="purchases_heading text-xl uppercase">Order details</h2>

                    <div className="purchases_ordersList text-base">
                        <div className="">
                            <p className='uppercase bold text-base'>order number</p>
                            <p className='text-base'>{id?.id}</p>
                        </div>

                        <div className="">
                            <p className='uppercase bold text-base'>order date</p>
                            <p className='text-base'>{order?.orderDate}</p>
                        </div>
                        <div className="">
                            <p className='uppercase bold text-base'>Delivery date</p>
                            <p className='text-base'>{order?.deliveryDate}</p>
                        </div>

                    </div>

                    <div className="checkout_thin_line"></div>

                    <div className="purchases_ordersList text-base">
                        <div className="">
                            <p className='uppercase bold text-base'>Amount Paid</p>
                            <p className='text-base'>Rs. {order?.Totalamount}</p>
                        </div>
                        <div className="">
                            <p className='uppercase bold text-base'>Payment Method</p>
                            <p className='text-base'>{order?.paymentMethod}</p>
                        </div>

                        <div className="">
                            <p className='uppercase bold text-base'>Billing details</p>
                            <p className='text-base'>{order?.userName}</p>
                            <p className='text-base'>{order?.userEmail}</p>
                        </div>

                        <div className="">
                            <p className='uppercase bold text-base'>Billing Address</p>
                            <p className='text-base'>{order?.billingAddress?.line1}</p>
                            <p className='text-base'>{order?.billingAddress?.line2}</p>
                            <p className='text-base'>{order?.billingAddress?.country}</p>
                        </div>
                        <div className="">
                            <p className='uppercase bold text-base'>Shipping Address</p>
                            <p className='text-base'>{order?.shippingAddress?.line1}</p>
                            <p className='text-base'>{order?.shippingAddress?.line2}</p>
                            <p className='text-base'>{order?.shippingAddress?.country}</p>
                        </div>
                    </div>

                    <div className="checkout_thin_line"></div>

                    <div className="purchases_ordersList text-base">
                        <div className="">
                            <p className='uppercase bold text-base'>Order summary</p>
                            <div className="orderDetails_cartBag">
                                {order?.items.map((item, index) => (
                                    <div key={index} className="order_detailsBagItem">
                                        <div className="cartBag_bagItemInner">
                                            <div className="cartBag_bagImageWrapper">
                                                <Link key={index} href={`/products/${item.slug}`} className='cartBag_bagImage'>
                                                    <img
                                                        className="cartBag_bagImage"
                                                        src={item.image}
                                                        alt=""
                                                    />
                                                </Link>
                                            </div>
                                            <div className="cartBag_bagItemDetails">
                                                <div className="cartBag_bagItemTop">
                                                    <div>
                                                        <p className="cartBag_itemName text-base">{item.title}</p>
                                                        <p className="cartBag_itemSize text-sm">Color - Gold</p>
                                                        <p className="cartBag_itemSize text-sm">Size - 16</p>
                                                        <p className="cartBag_itemSize text-sm">Items - 1</p>

                                                    </div>
                                                    <p className='text-xl'>₹ {item.price}</p>
                                                </div>
                                                <div className="purchases_orderFooter_inner">
                                                    <Link scroll={false} href={`/products/${order.slug}`} className="text-sm">
                                                        <p className="text-sm">View Product</p>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="checkout_thin_line"></div>

                    <div className="purchases_ordersList text-base">
                        <p className='uppercase bold text-base'>Return & Refund Information</p>

                        <div className="purchases_orderFooter_inner order_open_prdct">
                            <Link scroll={false} href={`/shipping-returns`} className="text-sm">
                                <p className="text-sm">Shipping & Returns</p>
                            </Link>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
