import React from 'react';
import AccountLeftSlide from '@/components/account/AccountLeftSlide';
import Link from 'next/link';

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

const AccountHome = () => {
  return (
    <div>
      <div className="account_wrapper">
        <div>
          <AccountLeftSlide />
        </div>

        <div className="account_rightSection">

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
                  {order.items.map((item, i) => (
                    <div key={i} className="purchases_itemBox">
                      <img
                        className="purchases_itemImg"
                        src={item.image}
                        alt={`Order item ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="purchases_orderFooter">
                  <p className="purchases_itemCount text-base">{order.items.length} Items</p>
                  <div className="purchases_orderFooter_inner">
                    <Link scroll={false} href={`/account/order/${order.id}`} className="text-sm">
                      <p className="text-sm">View order</p>
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountHome;
