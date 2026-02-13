import React from 'react'
import Link from 'next/link';
import { formatePrice, renderVariants } from '@/utils/Util';
import { RiDeleteBinLine } from '@remixicon/react';
import Image from 'next/image';

const OrderItems = ({ data, pricesIncludeTax, handleAddItem, handleRemoveItem }) => {
  return (
    <>
      <div className="">
        <h2 className="text-2xl  "> Order Summary <span>({data.length || 0})</span></h2>
        <div className="order_summary_thin_line"></div>
        <div data-lenis-prevent className={` summary_products_paren `}>
          <div
            className={`summary_products_inner ${data?.length > 2 ? "scroll-enabled" : ""
              }`}
          >
            {data && data.length > 0 && data?.map((item, index) => {
              const price = formatePrice(item?.variantDetail?.variantPrice || null);
              return (
                <>
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
                      <div className="  cartBag_bagItemBottom">
                        <div className=" summary_button_increment cartBag_qtyControl text-lg">
                          <div className=" gty_ctrl_btn_decr " onClick={() => handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, false)}>
                            <p>−</p>
                          </div>
                          <p>{item?.qty || 1}</p>
                          <div className=" gty_ctrl_btn_incr " onClick={() => handleAddItem(item?.productId, item?.variantDetail)}>
                            <p>+</p>
                          </div>
                        </div>
                        <div className=" summry_delete_btn cartBag_removeButton" onClick={() => handleRemoveItem(item?.productId, item?.variantDetail?.variantDetailId, true)}>
                          <RiDeleteBinLine size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })}
          </div>
        </div>

      </div>
    </>
  )
}

export default OrderItems