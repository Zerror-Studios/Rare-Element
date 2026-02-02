import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { GET_WISHLIST_ITEMS } from '@/graphql';
import { useAuthStore } from '@/store/auth-store';
import { getProductPriceLabel } from '@/utils/Util';

const Wishlist = ({ meta }) => {
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;

  const { data, loading, error } = useQuery(GET_WISHLIST_ITEMS, {
    variables: { userId },
    skip: !userId,
  });

  if (!userId) return null;

  const wishlistItems = data?.getWishlistItems?.items || [];

  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Wishlist"} />
        <div className="settings__content">
          <h1 className="settings__title text-xl">My Wishlist</h1>
          <div className="wishlist_empty_box">
            {loading && <p>Loading wishlist...</p>}
            {/* {error && <p className="text-red-500">Error loading wishlist: {error.message}</p>} */}
            {!loading && wishlistItems.length === 0 && (
              <div className="wishlist_empty_box_inner">
                <p className="text-xl ">Your wishlist is empty.</p>
                <Link href="/products" className="underline" title='go to shopping'>
                  Go to Shopping
                </Link>
              </div>
            )}
          </div>
          {wishlistItems.length > 0 && (
            <div className="wishlist_box">
              {wishlistItems.map((item) => (
                <Link scroll={false} key={item._id} title={item.product?.name} href={`/products/${item.product?.slug || item.product?._id}`} className='wishlist_card'>
                  <ProductCard
                    productId={item.product?._id}
                    name={item.product?.name}
                    price={getProductPriceLabel(item.product?.variants, item.product?.discountedPrice)}
                    assets={item.product?.assets}
                  />
                </Link>
              ))}
            </div>
          )}

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
