import React from 'react'
import Link from 'next/link';
import { formatePrice, renderVariants } from '@/utils/Util';
import { RiDeleteBinLine } from '@remixicon/react';
import Image from 'next/image';

const OrderItems = ({ data, pricesIncludeTax, handleAddItem, handleRemoveItem }) => {
  return (
    <>
      <div className="">
        <p className="checkout_subHeading text-lg uppercase"> Order Summary ({data.length || 0})</p>
        <div data-lenis-prevent className={` ${data.length > 2 && "summary_products_paren"} `}>
          <div className="summary_products_inner">
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
                      alt={item?.name}
                    />
                  </Link>

                  <div className="checkout_details">
                    <div className="checkout_topRow">
                      <div>
                        <Link prefetch scroll={false} href={`/products/${item?.product?.slug}`} className="checkout_productName text-lg">{item?.name}</Link>
                        <div className="cart_varients_div">
                          {renderVariants(item?.product?.productOptions || [], item?.variantDetail?.selectedOptions || [])}
                        </div>
                        <p className="checkout_metaText text-sm ">Quantity: {item?.qty}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="checkout_price text-lg">{price}</p>
                        {pricesIncludeTax && <p className="checkout_metaText text-xs">Inc. of all taxes</p>}
                      </div>
                    </div>
                    <div className="cartBag_bagItemBottom">
                      <div className="cartBag_qtyControl text-lg">
                        <div className="cartBag_qtyControl_dec" onClick={() => handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, false)}>
                          <p>−</p>
                        </div>
                        <p>{item?.qty || 1}</p>
                        <div className="cartBag_qtyControl_inc" onClick={() => handleAddItem(item?.productId, item?.variantDetail)}>
                          <p>+</p>
                        </div>
                      </div>
                      <div className="cartBag_removeButton" onClick={() => handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, true)}>
                        <RiDeleteBinLine size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  )
}

export default OrderItems