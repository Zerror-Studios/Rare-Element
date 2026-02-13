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
import { ADD_ITEM_TO_CART, APPLY_CART_COUPON, REMOVE_CART_COUPON, REMOVE_ITEM_FROM_CART } from "@/graphql";
import WishlistPopup from '../cart/WishlistPopup';
import { useAuthStore } from "@/store/auth-store";
import { AuthCookies } from "@/utils/AuthCookies";
import { useVisitor } from "@/hooks/useVisitor";

const couponSchema = z.object({ couponCode: z.string().min(1, "Enter Valid Coupon").optional() });
const OrderSummary = ({ data, loading, refetch }) => {
  const {
    totalprice = 0,
    itemcount = 0,
    pricesIncludeTax = false,
    discountedPrice = 0,
    totalDiscount = 0,
    totalTax = 0,
    cart = [],
    coupon: { couponId: isCouponApplied } = {}
  } = data || {};

  const { user, isLoggedIn } = useAuthStore((state) => state);

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

  const token = AuthCookies.get();
  const { visitorId } = useVisitor();
  const [applyCoupon, { loading: applyCouponLoading }] = useMutation(APPLY_CART_COUPON);
  const [removeCoupon, { loading: removeCouponLoading }] = useMutation(REMOVE_CART_COUPON);
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
    if (isCouponApplied && data?.coupon?.couponCode) {
      setValue("couponCode", data.coupon.couponCode);
    } else if (!isCouponApplied) {
      setValue("couponCode", "");
    }
  }, [isCouponApplied, data, setValue]);

  const onSubmit = async (formData) => {
    if (loading) return;
    if (!isLoggedIn && !visitorId) {
      toast.warn("Initializing session, please try again...");
      return;
    }
    try {
      const input = {
        ...(isLoggedIn && token ? { token } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
        couponCode: formData?.couponCode || null,
      };
      const { data: res } = await applyCoupon({
        variables: { ...input },
      });
      const { _id } = res?.applyCartCoupon || {};
      if (_id) {
        toast.success("Coupon Applied successfully!");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Failed to apply coupon");
    } finally {
      refetch();
    }
  };

  const onRemove = async () => {
    if (loading) return;
    if (!isLoggedIn && !visitorId) {
      toast.warn("Initializing session, please try again...");
      return;
    }
    try {
      const input = {
        ...(isLoggedIn && token ? { token } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
      };
      const { data: res } = await removeCoupon({
        variables: { ...input },
      });
      const r_data = res?.removeCartCoupon || null;
      if (r_data) {
        toast.success("Coupon Removed successfully!");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Failed to remove coupon");
    } finally {
      reset();
      refetch();
    }
  };

  const handleAddItem = async (productId, variantDetail) => {
    try {
      const { __typename, ...variantWithoutTypename } = variantDetail;
      const payload = {
        input: {
          productId,
          variantDetail: variantWithoutTypename,
          ...(isLoggedIn && token ? { token } : {}),
        },
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
      };

      const { data: res } = await addCartItem({ variables: payload });
      const message = res?.addItemToCart;
      if (!message) return;
      toast.success(message || "Item added successfully!");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item in cart");
    }
  };

  const performRemoveItem = async (
    productId,
    variantDetailId,
    isCompleteRemove = true
  ) => {
    try {
      const input = {
        ...(isLoggedIn && token ? { userId: user?._id } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
        productId,
        variantDetailId,
        isCompleteRemove,
      };
      const { data: res } = await removeCartItem({ variables: { input } });
      const message = res?.removeItemFromCart;
      if (!message) return;
      toast.success(message || "Item removed successfully!");
      await refetch();
    } catch (err) {
      toast.error("Failed to remove item from cart");
    }
  };

  const handleRemoveItem = async (
    productId,
    variantDetailId,
    isCompleteRemove = true
  ) => {
    if (isCompleteRemove) {
      const item = cart.find(
        (i) =>
          i.productId === productId &&
          i.variantDetail?.variantDetailId === variantDetailId
      );
      dispatch({ type: "OPEN_WISHLIST_POPUP", payload: item });
      return;
    }
    await performRemoveItem(productId, variantDetailId, isCompleteRemove);
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
              disabled={applyCouponLoading || removeCouponLoading || isCouponApplied}
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
            {formatePrice(totalprice)}
          </p>
        </div>
        <div className="checkout_borderRow"></div>
        <div className="checkout_row ">
          <p className="checkout_textBase text-sm uppercase">Discount</p>
          <p className="checkout_textBase text-sm uppercase">{`${totalDiscount > 0 ? "- " : ""}${formatePrice(totalDiscount)}`}</p>
        </div>
        <div className="checkout_borderRow"></div>
        <div className="checkout_row">
          <p className="checkout_textBase text-sm uppercase">Shipping Charges</p>
          <div className="shipping_price_group">
            <p className="checkout_textSm text-sm ">{true ? "Free" : formatePrice(100)}</p>
            {true && <span className="line-through tax_name text-sm">{formatePrice(100)}</span>}
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
                {formatePrice(totalTax)}
              </p>
            </div>
          </>
        )}
        <div className="checkout_borderRow"></div>
        <div className="checkout_row semibold uppercase text-2xl ">
          <p className="checkout_textBase text-lg uppercase">Total Payable Amount</p>
          <p className="checkout_subtotalValue">{formatePrice(discountedPrice)}</p>
        </div>

        <div className="checkout_btn text-base uppercase">
          <GreenBoxBtn title={"Pay Now"} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default OrderSummary