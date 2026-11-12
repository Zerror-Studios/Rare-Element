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
import { getEstimatedShipping, getShippingLabel } from '@/utils/shipping-label';
import { RiQuestionLine } from '@remixicon/react';
import { ADD_ITEM_TO_CART, APPLY_CART_PROMOTION, REMOVE_CART_PROMOTION, REMOVE_ITEM_FROM_CART } from "@/graphql";
import WishlistPopup from '../cart/WishlistPopup';
import CouponMessage from './CouponMessage';
import {
  REMOVE_ITEM_OVERRIDES,
  getErrorInfo,
  getErrorMessage,
} from "@/utils/errors";
import {
  CtaEnum,
  trackCouponApply,
  trackCouponFailed,
  trackCtaClick,
} from "@/utils/analytics-events";
import {
  COUPON_CODE_MAX_LENGTH,
  isPromotionReason,
  normaliseCouponCode,
} from "@/utils/coupon";

const couponSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(1, "Enter Valid Coupon")
    .max(COUPON_CODE_MAX_LENGTH)
    .optional(),
});

// The cart owner is the access token (signed in) or `guestId` (the guest
// checkout, backend PRD-041 FR-17). `session` (once reserved, or the kept
// unpaid order's) carries the authoritative server total; `locked` freezes
// the bag while the checkout is busy. One flow on both paths (owner,
// 2026-11-12): "Continue to payment" (`showContinue`, the form's submit
// button) reserves and shows the server total; "Pay now" (`payLabel`, or
// "Pay again" after a closed window) calls `onPay` and is enabled only
// while `canPay` (the session is reserved for exactly these details),
// otherwise disabled with a short hint. The kit tracks the place-order and
// pay-now clicks itself (kit 1.1.0). `couponNotice` is the checkout's note
// that the server dropped the bag's code at "Continue to payment".

const OrderSummary = ({
  data,
  session,
  loading,
  locked = false,
  refetch,
  guestId = null,
  showContinue = false,
  continueLoading = false,
  canPay = false,
  payLabel = "Pay now",
  payLoading = false,
  onPay = null,
  couponNotice = "",
  // Shipping for the address entered, before "Continue to payment"
  shippingEstimate = null,
  isEstimatingShipping = false,
  isPricing = false,
}) => {
  const guestVariables = guestId ? { guestId } : {};
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
  // A refused code: its own message under the field (and "Sign in" when
  // the code needs an account)
  const [couponError, setCouponError] = React.useState(null);
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
    setCouponError(null);
    try {
      const { data: res } = await applyCoupon({
        variables: { promotionCode: couponCode, ...guestVariables },
      });
      if (res?.applyCartPromotion?._id) {
        trackCouponApply(couponCode);
        toast.success("Coupon Applied successfully!");
      }
    } catch (err) {
      // PRD-013: the reason is the server code, never the message text.
      const { reason, code } = getErrorInfo(err);
      trackCouponFailed(couponCode, reason || code || "UNKNOWN");
      const message = getErrorMessage(err, "Failed to apply coupon");
      if (isPromotionReason(reason)) {
        setCouponError({ message, reason });
      } else {
        toast.error(message);
      }
    } finally {
      refetch();
    }
  };

  const onRemove = async () => {
    if (loading || isLocked()) return;
    setCouponError(null);
    try {
      const { data: res } = await removeCoupon({ variables: guestVariables });
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
        variables: {
          input: { productId, variantId: variantId || null, qty: 1 },
          ...guestVariables,
        },
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
        ...guestVariables,
        productId,
        variantId: variantId || null,
        isCompleteRemove,
      };
      const { data: res } = await removeCartItem({ variables: { input } });
      if (!res?.removeItemFromCart) return;
      toast.success("Item removed successfully!");
      await refetch();
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Failed to remove item from cart", REMOVE_ITEM_OVERRIDES),
      );
      // COM-32: the bag is out of date (several lines of this product).
      if (getErrorInfo(err).reason === "VARIANT_REQUIRED") await refetch();
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

  const applyCode = handleSubmit(onSubmit);
  const couponField = register("couponCode");

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
              {...couponField}
              placeholder="Discount Code"
              aria-label="Discount code"
              className="checkout_couponInput"
              style={{ width: "100%" }}
              maxLength={COUPON_CODE_MAX_LENGTH}
              disabled={applyCouponLoading || removeCouponLoading || isCouponApplied || locked}
              error={errors?.couponCode}
              // Normalise, then tell react-hook-form, so the form value is
              // always current (Safari keeps focus, so blur never comes)
              onChange={(e) => {
                e.target.value = normaliseCouponCode(e.target.value);
                setCouponError(null);
                couponField.onChange(e);
              }}
              // Enter applies the code; it never submits the checkout form
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (!isCouponApplied) applyCode();
              }} />
            <div className="checkout_couponBtn text-base uppercase">
              <GreenBoxBtn type="button" title={!isCouponApplied ? "Apply" : "Remove"} loading={applyCouponLoading || removeCouponLoading} onClick={!isCouponApplied ? applyCode : handleSubmit(onRemove)} />
            </div>
          </div>
          {couponError && !errors?.couponCode && (
            <p className="input_error_msg text-xs" role="alert">
              <CouponMessage
                message={couponError.message}
                reason={couponError.reason}
              />
            </p>
          )}
          {couponNotice && (
            <p className="input_error_msg text-xs" role="status">
              {couponNotice}
            </p>
          )}
          <div className=" coupon_info text-xs">
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
              {getShippingLabel({
                pricing,
                isPricing,
                estimate: shippingEstimate,
                estimating: isEstimatingShipping,
                isFreeShippingEnabled,
                format: formatePrice,
              })}
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
          <p className="checkout_textBase text-lg uppercase">
            {pricing ? "Total Payable Amount" : shippingEstimate?.available ? "Estimated Total" : "Subtotal"}
          </p>
          <p className="checkout_subtotalValue">
            {formatePrice(
              pricing
                ? pricing.total
                : Math.round((Number(discountedPrice) + getEstimatedShipping(pricing, shippingEstimate)) * 100) / 100,
            )}
          </p>
        </div>

        {!canPay && (
          <p className="checkout_paymentNote text-sm" role="status">
            Continue to payment to see your final total.
          </p>
        )}
        <div className="checkout_btn text-base uppercase">
          {showContinue && (
            <GreenBoxBtn
              title="Continue to payment"
              loading={continueLoading}
              data-testid="checkout-continue"
            />
          )}
          <GreenBoxBtn
            type="button"
            title={payLabel}
            loading={payLoading}
            disabled={!canPay}
            onClick={onPay || undefined}
            data-testid="checkout-pay-now"
          />
        </div>
      </div>
    </div>
  )
}

export default OrderSummary