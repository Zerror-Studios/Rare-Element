import React from 'react';
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import dynamic from 'next/dynamic';
const OrderList = dynamic(() => import('@/components/account/orders/OrderList'), { ssr: false });

const Account = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <div className="account_rightSection">
          <h2 className="purchases_heading text-xl">My purchases</h2>
          <OrderList />
        </div>
      </AccountLayout>
    </>
  );
};

export default Account;

export async function getStaticProps() {
  const meta = {
    title: "My Account – Nahara Jewellery",
    description: "Manage your Nahara account, track orders, update details, and view your wishlist.",
    keywords: ["Nahara account", "order tracking", "jewellery account"],
    primaryKeywords: ["Nahara account"],
    author: "Nahara",
    robots: "noindex, nofollow",
    og: {
      title: "My Account – Nahara Jewellery",
      description: "Manage your account and orders.",
    },
    twitter: {
      card: "summary_large_image",
      title: "My Account – Nahara Jewellery",
      description: "View and manage your Nahara account.",
    }
  };

  return { props: { meta } };
}
