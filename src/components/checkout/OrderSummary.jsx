"use client";
import React from 'react'
import z from "zod";
import Input from '@/components/ui/Input';
import OrderItems from '@/components/checkout/OrderItems';
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatePrice } from '@/utils/Util';
import { RiQuestionLine } from '@remixicon/react';
import { ADD_ITEM_TO_CART, APPLY_CART_PROMOTION, REMOVE_CART_PROMOTION, REMOVE_ITEM_FROM_CART } from "@/graphql";
import WishlistPopup from '../cart/WishlistPopup';
import { getErrorInfo, getErrorMessage } from "@/utils/errors";
import {
  CtaEnum,
  trackCouponApply,
  trackCouponFailed,
  trackCtaClick,
} from "@/utils/analytics-events";

const couponSchema = z.object({ couponCode: z.string().min(1, "Enter Valid Coupon").optional() });

// Checkout is customer-only, so the cart owner is always the access token.
// `session` (after "Pay Now") carries the authoritative server total;
// `locked` freezes the bag once an order exists for it.
const OrderSummary = ({ data, session, loading, locked = false, refetch }) => {
  const {
    totalprice = 0,
    pricesIncludeTax = false,
    discountedPrice = 0,
    totalDiscount = 0,
    totalTax = 0,
    isFreeShippingEnabled = false,
    cart = [],
    promotion,
  } = data || {};
  const isCouponApplied = !!promotion?.promotionCode;
  const pricing = session?.pricing;

  const initialState = {
    popupActive: false,
    itemToSave: null,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "SET_POPUP_ACTIVE":
        return { ...state, popupActive: action.payload };
      case "SET_ITEM_TO_SAVE":
        return { ...state, itemToSave: action.payload };
      case "OPEN_WISHLIST_POPUP":
        return { ...state, popupActive: true, itemToSave: action.payload };
      case "CLOSE_WISHLIST_POPUP":
        return { ...state, popupActive: false, itemToSave: null };
      default:
        return state;
    }
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { popupActive, itemToSave } = state;

  const [addCartItem] = useMutation(ADD_ITEM_TO_CART);
  const [removeCartItem] = useMutation(REMOVE_ITEM_FROM_CART);

  const [applyCoupon, { loading: applyCouponLoading }] = useMutation(APPLY_CART_PROMOTION);
  const [removeCoupon, { loading: removeCouponLoading }] = useMutation(REMOVE_CART_PROMOTION);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(couponSchema),
  });

  React.useEffect(() => {
    if (isCouponApplied) {
      setValue("couponCode", promotion.promotionCode);
    } else {
      setValue("couponCode", "");
    }
  }, [isCouponApplied, promotion, setValue]);

  const isLocked = () => {
    if (!locked) return false;
    toast.info("Your order is being placed; the bag can't change now.");
    return true;
  };

  const onSubmit = async (formData) => {
    if (loading || isLocked()) return;
    const couponCode = formData?.couponCode || "";
    trackCtaClick(CtaEnum.APPLY_COUPON);
    try {
      const { data: res } = await applyCoupon({
        variables: { promotionCode: couponCode },
      });
      if (res?.applyCartPromotion?._id) {
        trackCouponApply(couponCode);
        toast.success("Coupon Applied successfully!");
      }
    } catch (err) {
      // PRD-013: the reason is the server code, never the message text.
      const { reason, code } = getErrorInfo(err);
      trackCouponFailed(couponCode, reason || code || "UNKNOWN");
      toast.error(getErrorMessage(err, "Failed to apply coupon"));
    } finally {
      refetch();
    }
  };

  const onRemove = async () => {
    if (loading || isLocked()) return;
    try {
      const { data: res } = await removeCoupon();
      if (res?.removeCartPromotion) {
        toast.success("Coupon Removed successfully!");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove coupon"));
    } finally {
      reset();
      refetch();
    }
  };

  const handleAddItem = async (productId, variantId) => {
    if (isLocked()) return;
    try {
      const { data: res } = await addCartItem({
        variables: { input: { productId, variantId: variantId || null, qty: 1 } },
      });
      if (!res?.addItemToCart) return;
      toast.success("Item added successfully!");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to add item in cart"));
    }
  };

  const performRemoveItem = async (
    productId,
    variantId,
    isCompleteRemove = true
  ) => {
    if (isLocked()) return;
    try {
      const input = {
        productId,
        variantId: variantId || null,
        isCompleteRemove,
      };
      const { data: res } = await removeCartItem({ variables: { input } });
      if (!res?.removeItemFromCart) return;
      toast.success("Item removed successfully!");
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove item from cart"));
    }
  };

  const handleRemoveItem = async (
    productId,
    variantId,
    isCompleteRemove = true
  ) => {
    if (isCompleteRemove) {
      const item = cart.find(
        (i) =>
          i.productId === productId &&
          (i.variantId || null) === (variantId || null)
      );
      dispatch({ type: "OPEN_WISHLIST_POPUP", payload: item });
      return;
    }
    await performRemoveItem(productId, variantId, isCompleteRemove);
  };

  return (
    <div className="checkout_summaryContainer">
      {popupActive && (
        <WishlistPopup
          item={itemToSave}
          popupActive={popupActive}
          setPopupActive={(val) =>
            dispatch({ type: "SET_POPUP_ACTIVE", payload: val })
          }
          handleAddItem={handleAddItem}
          handleRemoveItem={performRemoveItem}
        />
      )}
      <div className="checkout_summaryWrapper">
        <OrderItems data={cart} pricesIncludeTax={pricesIncludeTax} handleAddItem={handleAddItem} handleRemoveItem={handleRemoveItem} />
        <div className="coupon_div">
          <div className="coupon_div_inner">
            <Input
              {...register("couponCode")}
              placeholder="Discount Code"
              className="checkout_couponInput"
              style={{ width: "100%" }}
              disabled={applyCouponLoading || removeCouponLoading || isCouponApplied || locked}
              error={errors?.couponCode}
              onChange={(e) => {
                let value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                value = value.toUpperCase();
                e.target.value = value;
              }} />
            <div className="checkout_couponBtn text-base uppercase">
              <GreenBoxBtn type="button" title={!isCouponApplied ? "Apply" : "Remove"} loading={applyCouponLoading || removeCouponLoading} onClick={!isCouponApplied ? handleSubmit(onSubmit) : handleSubmit(onRemove)} />
            </div>
          </div>
          <div className=" coupon_info text-xs">
            <p> • Offer applicable to first-time customers only.</p>
            <p> • Limited to one coupon per transaction. </p>
          </div>
        </div>

        <div className="checkout_row ">
          <p className="checkout_textBase text-sm uppercase">Cart Total</p>
          <p className="checkout_textBase text-sm uppercase">
            {formatePrice(pricing ? pricing.subtotal : totalprice)}
          </p>
        </div>
        <div className="checkout_borderRow"></div>
        <div className="checkout_row ">
          <p className="checkout_textBase text-sm uppercase">Discount</p>
          <p className="checkout_textBase text-sm uppercase">{`${(pricing ? pricing.discount : totalDiscount) > 0 ? "- " : ""}${formatePrice(pricing ? pricing.discount : totalDiscount)}`}</p>
        </div>
        <div className="checkout_borderRow"></div>
        <div className="checkout_row">
          <p className="checkout_textBase text-sm uppercase">Shipping Charges</p>
          <div className="shipping_price_group">
            <p className="checkout_textSm text-sm ">
              {pricing
                ? (pricing.isFreeShipping || pricing.shipping === 0 ? "Free" : formatePrice(pricing.shipping))
                : (isFreeShippingEnabled ? "Free" : "Calculated at payment")}
            </p>
          </div>
        </div>

        {/* Tax Row with Popover */}
        {data?.taxBreakdown?.length > 0 && (
          <>
            <div className="checkout_borderRow"></div>
            <div className="checkout_row tax_row_container">
              <div className="tax_label_group">
                <p className="checkout_textBase text-sm uppercase">Taxes</p>
                <div className="tax_popover_wrapper">
                  <RiQuestionLine size={14} className="tax_info_icon" />
                  <div className="tax_popover">
                    <div className="tax_popover_header text-sm">
                      <p>
                        Tax Breakdown
                      </p>
                    </div>
                    {data.taxBreakdown.map((tax, index) => (
                      <div key={index} className="tax_popover_row text-sm">
                        <span>{tax.name} ({tax.rate}%)</span>
                        <span>{formatePrice(tax.amount)}</span>
                      </div>
                    ))}
                    <div className="tax_popover_note text-xs">
                      <ul>
                        <li>All taxes have been calculated and included in the final payable amount.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <p className="checkout_textBase text-sm uppercase">
                {formatePrice(pricing ? pricing.tax : totalTax)}
              </p>
            </div>
          </>
        )}
        <div className="checkout_borderRow"></div>
        {/* The payable total is the server's checkout-session total. */}
        <div className="checkout_row semibold uppercase text-2xl ">
          <p className="checkout_textBase text-lg uppercase">{pricing ? "Total Payable Amount" : "Subtotal"}</p>
          <p className="checkout_subtotalValue">{formatePrice(pricing ? pricing.total : discountedPrice)}</p>
        </div>

        <div className="checkout_btn text-base uppercase">
          <GreenBoxBtn
            title={"Pay Now"}
            loading={loading}
            onClick={() => trackCtaClick(CtaEnum.PAY_NOW)}
          />
        </div>
      </div>
    </div>
  )
}

export default OrderSummary