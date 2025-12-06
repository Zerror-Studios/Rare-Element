import React, { useState } from "react";
import { formatePrice, renderVariants } from "@/utils/Util";
import { RiDeleteBinLine } from "@remixicon/react";
const CartItem = ({
  item,
  handleAddItem,
  handleRemoveItem,
}) => {
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const onRemove = async (isCompleteRemove = true) => {
    try {
      setRemoving(true);
      await handleRemoveItem(
        item?.productId || null,
        item?.variantDetail?.variantDetailId || null,
        isCompleteRemove
      );
    } finally {
      setRemoving(false);
    }
  };

  const onAdd = async () => {
    try {
      setAdding(true);
      await handleAddItem(item?.productId || null, item?.variantDetail || {});
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="cartBag_bagItem">
      <div className="cartBag_bagItemInner">
        <div className="cartBag_bagImageWrapper">
          <div className='cartBag_bagImage'>
            <img
              className="cartBag_bagImage"
              src={item?.asset?.path || ""}
              alt={item?.asset?.altText || ""}
            />
          </div>
        </div>
        <div className="cartBag_bagItemDetails">
          <div className="cartBag_bagItemTop">
            <div className="cartBag_itemHead">
              <p className="cartBag_itemName text-base">{item?.name}</p>
              {renderVariants(item?.variantDetail?.selectedOptions || [])}
            </div>
            <p className='text-xl crt_itms_price'>{`${item.qty > 1 ? `${item?.qty} x` : ""} ${formatePrice(
              item?.variantDetail?.variantPrice || 0
            )}`}</p>
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