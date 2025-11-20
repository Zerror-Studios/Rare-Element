import { RiArrowRightSLine } from '@remixicon/react'
import Link from 'next/link'
import React from 'react'
import AccountLeftSlide from '@/components/account/AccountLeftSlide'

const orders = [
    {
        id: "42027098022",
        status: "Delivered",
        date: "28/05/2025",
        amount: "Rs.2,798.00",
        items: [
      "https://palmonas.com/cdn/shop/files/DSC09339.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/DSC09338.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/DSC09341_98dd383e-380f-401a-9d80-95220bae05cc.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/BR093-RG_1ecf6e0a-8c78-4a57-8726-b3f3e7524a9b.jpg?v=1744526386&width=900",
        ],
        totalItems: 2,
    },
    {
        id: "42027098022",
        status: "Delivered",
        date: "28/05/2025",
        amount: "Rs.2,798.00",
        items: [
      "https://palmonas.com/cdn/shop/files/DSC09339.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/DSC09338.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/BR093-RG_1ecf6e0a-8c78-4a57-8726-b3f3e7524a9b.jpg?v=1744526386&width=900",
      "https://palmonas.com/cdn/shop/files/BR093-B_b2505079-b550-4521-8d72-32af352050af.jpg?v=1744526386&width=900"
        ],
        totalItems: 2,
    },
]

const Purchases = () => {
    return (
        <div className="purchases_wrapper">

            <div className="purchases_leftSlide">
                <AccountLeftSlide />
            </div>

            <div className="purchases_breadcrumb">
                <Link href="/account">
                    <p className="purchases_breadcrumbLink text-sm">Account</p>
                </Link>
                <RiArrowRightSLine size={14} />
                <p className='text-sm'>Orders</p>
            </div>

            <div className="purchases_rightSection">
                <h2 className="purchases_heading text-xl">My purchases</h2>

                <div className="purchases_ordersList">
                    {orders.map((order, index) => (
                        <div key={index} className="purchases_orderCard">
                            <p className='text-base'>Order: {order.id}</p>
                            <p className="purchases_status text-base">{order.status}</p>

                            <div>
                                <p>{order.date}</p>
                                <p className="purchases_amount text-base">{order.amount}</p>
                            </div>

                            <div className="purchases_itemsGrid">
                                {order.items.map((img, i) => (
                                    <div key={i} className="purchases_itemBox">
                                        <img
                                            className="purchases_itemImg"
                                            src={img}
                                            alt={`Order item ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="purchases_orderFooter">
                                <p className="purchases_itemCount text-base">{order.totalItems} Items</p>
                                <p className="purchases_viewOrder text-sm">View Order</p>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Purchases
