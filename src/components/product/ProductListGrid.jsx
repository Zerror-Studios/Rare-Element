import React from 'react'
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard'
import { getProductPriceLabel } from '@/utils/Util';

const ProductListGrid = ({ title, data }) => {

  if (!data || data.length === 0) return null;
  return (
    <div className="suggestion_parent padding">
      <div className="suggestion_parent_header">
        <p className='text-base thin uppercase'>{title}</p>
      </div>
      <div className="suggestion_scroll relative">
        {data?.map((item) => (
          <Link prefetch key={item?._id} scroll={false} href={`/products/${item?.slug || item?._id}`}>
            <div className="suggestion_shopcard">
              <ProductCard
                key={item?._id}
                productId={item?._id}
                name={item?.name || ""}
                price={getProductPriceLabel(item?.variants, item?.discountedPrice)}
                assets={item?.assets || []}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ProductListGrid