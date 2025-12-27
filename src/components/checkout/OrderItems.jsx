import React from 'react'
import Link from 'next/link';
// import { RiDeleteBinLine } from '@remixicon/react'
import { formatePrice, renderVariants } from '@/utils/Util';
import { RiDeleteBinLine } from '@remixicon/react';
import Image from 'next/image';

const OrderItems = ({ data }) => {
  return (
    <>
      <div className="">
        <p className="checkout_subHeading text-lg uppercase"> Order Summary ({data?.length})</p>
        <div className="summary_products_paren">
          {data && data.length > 0 && data?.map((item, index) => {
            const price = formatePrice(item?.variantDetail?.variantPrice || null);
            return (
              <div key={index} className="checkout_item">
                <Link prefetch scroll={false} href={`/products/${item?.product?.slug}`} className="checkout_imgWrapper">
                  <Image
                    width={150}
                    height={200}
                    className="checkout_productImg"
                    src={item?.asset?.path || ""}
                    alt={item?.asset?.altText || ""}
                  />
                </Link>

                <div className="checkout_details">
                  <div className="checkout_topRow">
                    <div>
                      <Link prefetch scroll={false} href={`/products/${item?.product?.slug}`} className="checkout_productName text-base">{item?.name}</Link>
                      <div className="cart_varients_div">
                        {renderVariants(item?.product?.productOptions || [], item?.variantDetail?.selectedOptions || [])}
                      </div>
                      <p className="checkout_metaText text-xs ">Quantity: {item?.qty}</p>
                    </div>
                    <p className="checkout_price  text-base">{price}</p>
                  </div>
                  {/* <div className="cartBag_bagItemBottom">
                    <div className="cartBag_qtyControl text-lg">
                      <div className="cartBag_qtyControl_dec">
                        <p>−</p>
                      </div>
                      <p>1</p>
                      <div className="cartBag_qtyControl_inc">
                        <p>+</p>
                      </div>
                    </div>
                    <div className="cartBag_removeButton">
                      <RiDeleteBinLine size={16} />
                    </div>
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  )
}

export default OrderItems