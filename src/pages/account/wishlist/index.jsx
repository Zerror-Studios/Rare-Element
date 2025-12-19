import React from 'react';
// import Link from 'next/link';
// import ProductCard from '@/components/common/ProductCard';
// import { ProductsData } from '@/utils/ProductsData';
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';

const Wishlist = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Wishlist"} />
        <div className="settings__content">
          <h2 className="settings__title text-xl">My Wishlist</h2>

          <div className="wishlist_box">
            {/* {ProductsData?.map((item, idx) => (
              <Link scroll={false} key={idx} href={`/products/${item.slug}`} className='wishlist_card'>
                <ProductCard item={item} />
              </Link>
            ))} */}
          </div>

        </div>
      </AccountLayout>
    </>
  );
};

export default Wishlist;

export async function getStaticProps() {
  const meta = {
    title: "Your Wishlist | Saved Jewellery Designs – Nahara",
    description:
      "View all your favourite saved jewellery pieces. Keep track of rings, earrings, necklaces and more that you love.",
    keywords: [
      "wishlist",
      "saved jewellery",
      "Nahara wishlist",
      "favourite jewellery"
    ],
    primaryKeywords: ["wishlist", "saved products"],
    author: "Nahara",
    robots: "index,follow",
    og: {
      title: "Your Wishlist | Nahara",
      description:
        "Browse your saved jewellery items and shop your favourites.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Your Wishlist | Nahara",
      description:
        "View and manage your favourite saved jewellery pieces.",
    }
  };

  return { props: { meta } };
}
