"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatePrice } from "@/utils/Util";
import { RiDeleteBinLine } from "@remixicon/react";
import Image from "next/image";
const CartItem = ({
  item,
  handleAddItem,
  handleRemoveItem,
  pricesIncludeTax,
  onClose,
}) => {
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const onRemove = async (isCompleteRemove = true) => {
    try {
      setRemoving(true);
      await handleRemoveItem(
        item?.productId || null,
        item?.variantId || null,
        isCompleteRemove
      );
    } finally {
      setRemoving(false);
    }
  };

  const onAdd = async () => {
    try {
      setAdding(true);
      await handleAddItem(item?.productId || null, item?.variantId || null);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="cartBag_bagItem">
      <div className="cartBag_bagItemInner">
        <div className="cartBag_bagImageWrapper">
          <Link prefetch={false} scroll={false} onClick={onClose} href={`/products/${item?.productId}`} className='cartBag_bagImage'>
            <Image
              width={150}
              height={200}
              className="cartBag_bagImage"
              src={item?.asset?.path || "/green_logo.svg"}
              alt={item?.asset?.altText || item?.name || "Cart Item Image"}
              sizes="150px"
            />
          </Link>
        </div>
        <div className="cartBag_bagItemDetails">
          <div className="cartBag_bagItemTop">
            <div className="cartBag_itemHead">
              <Link prefetch={false} scroll={false} onClick={onClose} href={`/products/${item?.productId}`} className="cartBag_itemName text-base">
                <p>
                  {item?.name}
                </p>
              </Link>
            </div>
            <div className="crt_itms_price_group">
              <p className='crt_itms_price'>{`${item.qty > 1 ? `${item?.qty} x` : ""} ${formatePrice(
                item?.finalPrice || 0
              )}`}</p>
              <p className="inclusive_tax_msg">{pricesIncludeTax ? "Incl. of all taxes" : "Excl. of all taxes"}</p>
            </div>
          </div>
          <div className="cartBag_bagItemBottom">
            <div className="cartBag_qtyControl text-lg">
              <button className="cartBag_qtyControl_dec" disabled={removing} onClick={() => onRemove(false)}>
                <p>−</p>
              </button>
              <p>{item.qty}</p>
              <button className="cartBag_qtyControl_inc" disabled={adding} onClick={onAdd}>
                <p>+</p>
              </button>
            </div>
            <button
              className="cartBag_removeButton"
              disabled={removing}
              onClick={() => onRemove(true)}
            >
              {removing ? "Removing..." : <RiDeleteBinLine size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItem