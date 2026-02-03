import React from 'react'
import z from "zod";
import Input from '@/components/ui/Input';
import OrderItems from '@/components/checkout/OrderItems';
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { APPLY_CART_COUPON, REMOVE_CART_COUPON } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { AuthCookies } from "@/utils/AuthCookies";
import { useVisitor } from "@/hooks/useVisitor";
import { formatePrice } from '@/utils/Util';

const couponSchema = z.object({ couponCode: z.string().min(1, "Enter Valid Coupon").optional() });
const OrderSummary = ({ data, loading, refetch }) => {
  const {
    totalprice = 0,
    itemcount = 0,
    isFreeShippingEnabled = false,
    discountedPrice = 0,
    totalDiscount = 0,
    cart = [],
    coupon: { couponId: isCouponApplied } = {}
  } = data || {};
  const token = AuthCookies.get();
  const { visitorId } = useVisitor();
  const { isLoggedIn } = useAuthStore((state) => state);
  const [applyCoupon, { loading: applyCouponLoading }] = useMutation(APPLY_CART_COUPON);
  const [removeCoupon, { loading: removeCouponLoading }] = useMutation(REMOVE_CART_COUPON);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(couponSchema),
  });

  const onSubmit = async (data) => {
    if (loading) return;
    try {
      const input = {
        ...(isLoggedIn && token ? { token } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
        couponCode: data?.couponCode || null,
      };
      const { data: response } = await applyCoupon({
        variables: { ...input },
      });
      const { _id } = response?.applyCartCoupon || {};
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
    try {
      const input = {
        ...(isLoggedIn && token ? { token } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
      };
      const { data: response } = await removeCoupon({
        variables: { ...input },
      });
      const data = response?.removeCartCoupon || null;
      if (data) {
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

  return (
    <div className="checkout_summaryContainer">
      <div className="checkout_summaryWrapper">
        <OrderItems data={cart} count={itemcount} />
        <div className="coupon_div">
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

        <div className="checkout_row ">
          <p className="checkout_textBase text-lg uppercase">Subtotal</p>
          <p className="checkout_textBase text-lg uppercase">
            {formatePrice(
              data?.pricesIncludeTax
                ? totalprice - (data?.totalTax || 0)
                : totalprice
            )}
          </p>
        </div>
        {!!totalDiscount && (
          <div className="checkout_row ">
            <p className="checkout_textBase text-lg uppercase">Discount</p>
            <p className="checkout_textBase text-lg uppercase">-{formatePrice(totalDiscount)}</p>
          </div>
        )}
        <div className="checkout_borderRow">
          <p className="checkout_textSm text-lg uppercase">Shipping Charge</p>
          <p className="checkout_textSm text-lg uppercase">{isFreeShippingEnabled ? "Free" : formatePrice(0)}</p>
        </div>
        <div className="checkout_row">
          <p className="checkout_textSm text-lg uppercase">Taxes & Charges</p>
          <p className="checkout_textSm text-lg uppercase"></p>
        </div>

        {/* Tax Breakdown */}
        {data?.taxBreakdown?.length > 0 && (
          <div className="tax_breakdown_section">
            {data.taxBreakdown.map((tax, index) => (
              <div key={index} className="tax_row">
                <p className="tax_name">
                  {tax.name} ({tax.rate}%)
                </p>
                <p className="tax_amount">
                  {formatePrice(tax.amount)}
                </p>
              </div>
            ))}

          </div>
        )}

        <div className="checkout_row semibold uppercase text-2xl">
          <p className="checkout_subtotalText bold">Total</p>
          <p className="checkout_subtotalValue ">{formatePrice(discountedPrice)}</p>
        </div>

        <div className="checkout_btn text-base uppercase">
          <GreenBoxBtn title={"Pay Now"} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default OrderSummary