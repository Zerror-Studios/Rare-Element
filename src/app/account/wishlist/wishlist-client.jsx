"use client";

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_BY_ID } from '@/graphql';
import { useAuthStore } from '@/store/auth-store';
import { useWishlist } from '@/hooks/useWishlist';
import { getProductPriceLabel } from '@/utils/Util';

// The wishlist stores product ids; each card loads its product (published
// products only, so a retired product simply disappears).
const WishlistItem = ({ productId }) => {
  const { data } = useQuery(GET_PRODUCT_BY_ID, { variables: { id: productId } });
  const product = data?.getClientSideProductById;
  if (!product) return null;
  return (
    <Link scroll={false} href={`/products/${product?.slug || product?._id}`} className='wishlist_card'>
      <ProductCard
        productId={product?._id}
        name={product?.name}
        price={getProductPriceLabel(product?.variants)}
        assets={product?.assets}
        product={product}
        listName="Wishlist"
      />
    </Link>
  );
};

const WishlistClient = () => {
  const { isLoggedIn } = useAuthStore();
  const { items: wishlistItems, loading } = useWishlist();

  if (!isLoggedIn) {
    return (
      <div className="settings__content">
        <p>Please login to view your wishlist.</p>
      </div>
    );
  }

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
              <WishlistItem key={item?._id} productId={item?.productId} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistClient;
