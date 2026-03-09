"use client";

import dynamic from 'next/dynamic';

const OrderList = dynamic(() => import('@/components/account/orders/OrderList'), { ssr: false });

export default function AccountClient() {
  return (
    <div className="account_rightSection">
      <h1 className="purchases_heading text-xl">My purchases</h1>
      <OrderList />
    </div>
  );
}
