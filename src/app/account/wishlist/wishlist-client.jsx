"use client";

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { GET_WISHLIST_ITEMS } from '@/graphql';
import { useAuthStore } from '@/store/auth-store';
import { getProductPriceLabel } from '@/utils/Util';

const WishlistClient = () => {
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;

  const { data, loading, error } = useQuery(GET_WISHLIST_ITEMS, {
    variables: { userId },
    skip: !userId,
  });

  if (!userId) {
    return (
      <div className="settings__content">
        <p>Please login to view your wishlist.</p>
      </div>
    );
  }

  const wishlistItems = data?.getWishlistItems?.items || [];

  return (
    <>
      <AccountBreadcrumb title={"Wishlist"} />
      <div className="settings__content">
        <h1 className="settings__title text-xl">My Wishlist</h1>
        <div className="wishlist_empty_box">
          {loading && <p>Loading wishlist...</p>}
          {!loading && wishlistItems.length === 0 && (
            <div className="wishlist_empty_box_inner">
              <p className="text-xl ">Your wishlist is empty.</p>
              <Link href="/products" className="text_decoration_underline">
                Go to Shopping
              </Link>
            </div>
          )}
        </div>
        {wishlistItems.length > 0 && (
          <div className="wishlist_box">
            {wishlistItems.map((item) => (
              <Link scroll={false} key={item?._id} href={`/products/${item?.product?.slug || item?.product?._id}`} className='wishlist_card'>
                <ProductCard
                  productId={item?.product?._id}
                  name={item?.product?.name}
                  price={getProductPriceLabel(item?.product?.variants, item?.product?.discountedPrice)}
                  assets={item?.product?.assets}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistClient;
