"use client";

/**
 * Checkout without signing in (backend PRD-041 FR-4, FR-17), on the kit's
 * `useCheckout().startGuest` → `pay()` (kit 1.1.0).
 *
 * One page, three steps in the store's checkout design:
 * - **Contact** (`GuestContactDetail`): email and phone (required), names,
 *   the unticked news box and "Already have an account? Sign in" (the
 *   code sign-in, back to this checkout, where the signed-in checkout
 *   opens the bag merged at sign-in);
 * - **Delivery:** the address form (`Delivery`; a guest has no saved
 *   addresses) and the billing address;
 * - **Payment** (`OrderSummary`): "Continue to payment" opens the guest
 *   session (its stock hold only on this explicit action, PRD-014
 *   W0V2-02) and shows the server total; "Pay now" (disabled until then,
 *   with "Continue to payment to see your final total") places the order
 *   and opens the payment app; a closed payment window → a toast and "Pay
 *   again" (`retryPayment`; the kit sends GA4's `checkout_error` itself).
 *
 * The same flow as the signed-in checkout (`app/checkout/checkout-client.jsx`).
 * Any change to the contact, the news box, the addresses or the bag (lines
 * or coupon) after "Continue" disables "Pay now" until "Continue" is
 * pressed again (`isReservedFor`). The ads begin checkout is sent once per
 * page load when the page opens with items (`useAdsBeginCheckout`, shared
 * with the signed-in path). The guest checkout token stays
 * in the kit (`GuestCheckoutStore`, this tab only). Once paid the shopper
 * goes to the order status page (`orderStatusPath(statusToken)`), else
 * thank-you; a failed payment of a placed order goes to
 * `/checkout/payment-failed`, whose "Retry payment" pays the kept order
 * (`retryPayment`). The kit sends the analytics and ads purchase events.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useCheckout } from "@zcom/storefront-kit/client";
import {
  GuestCheckoutStore,
  PendingOrderStore,
  orderStatusPath,
} from "@zcom/storefront-kit/core";
import { CART_LIST } from "@/graphql";
import { useVisitor } from "@/hooks/useVisitor";
import { useAdsBeginCheckout } from "@/hooks/useAdsBeginCheckout";
import { useDroppedCouponCheck } from "@/hooks/useDroppedCouponCheck";
import { isPromotionReason } from "@/utils/coupon";
import CouponMessage from "./CouponMessage";
import { GuestCheckoutSchema } from "@/validations/CheckoutValidation";
import { EmailSubscribedStatus } from "@/utils/Constant";
import { getKitKeyMessage } from "@/utils/errors";
import {
  getCartFingerprint,
  getDetailsKey,
  isReservedFor,
} from "@/utils/checkout-kit";
import { toGuestCheckoutInput } from "@/utils/guest-checkout";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import GuestContactDetail from "./GuestContactDetail";
import Delivery from "./Delivery";
import BillingAddress from "./BillingAddress";
import OrderSummary from "./OrderSummary";
import Loader from "./Loader";

// ─── Constants ────────────────────────────────────────────────────────────

/** Answers after which the bag on screen is stale. */
const CART_REFRESH_KEYS = [
  "PRICE_CHANGED",
  "PROMOTION_INVALID",
  "OUT_OF_STOCK",
  "INSUFFICIENT_STOCK",
  "EMPTY_CART",
];
/** Answers that belong to the delivery address. */
const ADDRESS_KEYS = ["SHIPPING_UNAVAILABLE", "ADDRESS_REQUIRED"];
/** Answers that belong to the contact. */
const CONTACT_KEYS = ["INVALID_EMAIL", "INVALID_PHONE"];
/** Failures with no placed order to retry (stay on this page). */
const NO_RETRY_KEYS = ["INVALID_GUEST_TOKEN", "ORDER_CANCELLED", "ORDER_NOT_FOUND"];
/** After any of these the checkout starts over from "Continue". */
const START_OVER_KEYS = [
  "INVALID_GUEST_TOKEN",
  "CHECKOUT_EXPIRED",
  "RESERVATION_RELEASED",
];

const DEFAULT_ADDRESS = {
  addressType: "",
  countryCode: "+91",
  country: "India",
};

const scrollTo = (selector) =>
  document
    .querySelector(selector)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });

// ─── Component ────────────────────────────────────────────────────────────

const GuestCheckout = () => {
  const router = useRouter();
  const { visitorId } = useVisitor();
  const checkout = useCheckout();
  const [isReady, setIsReady] = useState(false);
  // The details "Continue to payment" reserved; null until then
  const [reservedKey, setReservedKey] = useState(null);
  const [formError, setFormErrorText] = useState("");
  // The kit key behind `formError` (a "Sign in" link for its answer)
  const [formErrorKey, setFormErrorKey] = useState(null);
  const setFormError = (message, key = null) => {
    setFormErrorText(message);
    setFormErrorKey(key);
  };
  // True once the browser is leaving (status page, payment page)
  const [isLeaving, setIsLeaving] = useState(false);
  const cartFingerprintRef = useRef(null);
  const payingRef = useRef(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const {
    data: response,
    loading,
    error: cartError,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !visitorId,
    variables: { guestId: visitorId },
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });
  const cartData = response?.getCart || {};
  const hasItems = (cartData?.cart || []).length > 0;

  // The ads networks' begin checkout, once per page load (both paths);
  // the kit sends GA4's `begin_checkout` once reserved
  useAdsBeginCheckout(cartData);
  // A bag code the server dropped at "Continue to payment"
  const droppedCoupon = useDroppedCouponCheck(cartData, refetch);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setFocus,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(GuestCheckoutSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      contact: {
        email: "",
        countryCode: "+91",
        phone: "",
        firstName: "",
        lastName: "",
      },
      shippingAddress: { ...DEFAULT_ADDRESS, primary: true },
      billingAddress: { ...DEFAULT_ADDRESS, primary: false },
      // PRD-014 UX-29: marketing email is opt-in, never pre-ticked
      emailSubscribedStatus: EmailSubscribedStatus.UNSUBSCRIBED,
      useShippingAsBilling: true,
    },
  });

  const values = useWatch({ control });
  const wantsNews =
    values?.emailSubscribedStatus === EmailSubscribedStatus.SUBSCRIBED;

  // The bag and every detail as sent: a change needs "Continue" again
  const cartFingerprint = cartData?._id ? getCartFingerprint(cartData) : null;
  const details = toGuestCheckoutInput(cartData, {
    acceptsMarketing: wantsNews,
    contact: values?.contact,
    shippingAddress: values?.shippingAddress,
    billingAddress: values?.billingAddress,
    useShippingAsBilling: values?.useShippingAsBilling,
  });
  const detailsKey = getDetailsKey(cartFingerprint, details);
  const isBusy = checkout.isBusy || isLeaving;
  const isReserved = isReservedFor({
    hasSession: Boolean(checkout.session),
    step: checkout.step,
    reservedKey,
    detailsKey,
  });
  // A dismissed payment window: pay the same order again
  const canPayAgain =
    isReserved && checkout.step === "dismissed" && Boolean(checkout.orderId);

  // A changed bag or coupon: a kept unpaid order no longer matches it (the
  // kit's fingerprint has the lines, not the coupon), so drop it
  useEffect(() => {
    if (!cartFingerprint) return;
    const previous = cartFingerprintRef.current;
    cartFingerprintRef.current = cartFingerprint;
    if (previous && previous !== cartFingerprint) {
      // The server's own drop of a code that no longer applies keeps the
      // session (its total is the one shown)
      if (droppedCoupon.isExpectedChange(cartFingerprint)) return;
      droppedCoupon.clear();
      PendingOrderStore.clear();
      setReservedKey(null);
    }
  }, [cartFingerprint]);

  // The kit's refusal → its message, at the right step
  useEffect(() => {
    if (checkout.step !== "failed" || !checkout.error) return;
    const key = checkout.error;
    const message = getKitKeyMessage(key);
    setFormError(message, key);
    toast.error(<CouponMessage message={message} reason={key} />);
    if (START_OVER_KEYS.includes(key)) {
      GuestCheckoutStore.clear();
      PendingOrderStore.clear();
      setReservedKey(null);
    }
    if (CART_REFRESH_KEYS.includes(key) || isPromotionReason(key)) refetch();
    if (ADDRESS_KEYS.includes(key)) setFocus("shippingAddress.states");
    if (CONTACT_KEYS.includes(key)) scrollTo(".guest_contact");
  }, [checkout.step, checkout.error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Contact → delivery prefill ─────────────────────────────────────────

  /** Copies the contact's names and phone into empty delivery fields. */
  const prefillDelivery = () => {
    const contact = getValues("contact") || {};
    const address = getValues("shippingAddress") || {};
    if (!address.firstname && contact.firstName) {
      setValue("shippingAddress.firstname", contact.firstName);
    }
    if (!address.lastname && contact.lastName) {
      setValue("shippingAddress.lastname", contact.lastName);
    }
    if (!address.phone && contact.phone) {
      setValue("shippingAddress.phone", contact.phone);
      setValue("shippingAddress.countryCode", contact.countryCode || "+91");
    }
  };

  // ─── Steps ──────────────────────────────────────────────────────────────

  const onInvalid = (formErrors) => {
    const message = formErrors?.contact
      ? "Please check your contact details."
      : formErrors?.shippingAddress
        ? "Please complete your shipping address."
        : "Please complete your billing address.";
    setFormError(message);
    if (formErrors?.contact) scrollTo(".guest_contact");
  };

  /** "Continue to payment": opens the guest session for these details. */
  const onContinue = async (formValues) => {
    if (!cartData?._id || !hasItems) {
      setFormError(
        loading
          ? "Your bag is still loading. Please try again in a moment."
          : getKitKeyMessage("EMPTY_CART"),
      );
      return;
    }
    setFormError("");
    const reservedDetails = details;
    const session = await checkout.startGuest(
      toGuestCheckoutInput(cartData, {
        ...formValues,
        acceptsMarketing: wantsNews,
      }),
    );
    if (!session) return;
    const fingerprint = await droppedCoupon.check(session);
    setReservedKey(getDetailsKey(fingerprint, reservedDetails));
  };

  /** Where a finished payment goes: the status page, else thank-you. */
  const goAfterPayment = (result) => {
    const kept = GuestCheckoutStore.get();
    const path = orderStatusPath(result.statusToken ?? kept?.statusToken);
    const orderId = result.orderId ?? kept?.orderId;
    setIsLeaving(true);
    router.replace(
      path ||
        (orderId
          ? `/checkout/thank-you?orderId=${encodeURIComponent(orderId)}`
          : "/checkout/thank-you"),
    );
  };

  /** "Pay now" (reserved for these details): places the order and pays. */
  const onPay = async () => {
    if (payingRef.current || isBusy || !isReserved) return;
    setFormError("");
    payingRef.current = true;
    let result;
    try {
      result = canPayAgain
        ? await checkout.retryPayment(checkout.orderId)
        : await checkout.pay();
    } finally {
      payingRef.current = false;
    }
    if (result.step === "paid" || result.step === "unconfirmed") {
      goAfterPayment(result);
      return;
    }
    if (result.step === "redirecting") {
      setIsLeaving(true);
      return;
    }
    // The kit sends GA4's checkout_error (PAYMENT_DISMISSED) itself
    if (result.step === "dismissed") {
      toast.info("Payment was not completed. You can try again.");
      return;
    }
    if (result.step !== "failed") return;
    // A placed order whose payment failed: the failure page retries it
    const orderId = result.orderId ?? GuestCheckoutStore.get()?.orderId;
    if (orderId && !NO_RETRY_KEYS.includes(result.reason)) {
      setIsLeaving(true);
      const params = new URLSearchParams({ orderId, reason: "FAILED" });
      router.push(`/checkout/payment-failed?${params.toString()}`);
    }
  };

  // Enter in the form: "Pay now" once reserved, else "Continue to payment"
  const onSubmit = (formValues) =>
    isReserved ? onPay() : onContinue(formValues);

  // ─── States ─────────────────────────────────────────────────────────────

  const emptyBag = (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl font-bold">Your bag is empty</h1>
        <p className="uppercase mt-2">
          Add something you love, then come back to check out.
        </p>
        <div className="w-full">
          <GreenBoxBtn type="button" title="Continue Shopping" href="/products" />
        </div>
      </div>
    </div>
  );

  if (isReady && !visitorId) return emptyBag;
  if (cartError && !response) {
    return (
      <div className="status_section center" role="alert">
        <div className="status_section_inner">
          <h1 className="text-3xl font-bold">We couldn&apos;t load your bag</h1>
          <p className="uppercase mt-2">{getKitKeyMessage("NETWORK")}</p>
          <div className="w-full">
            <GreenBoxBtn type="button" title="Try again" onClick={() => refetch()} />
          </div>
        </div>
      </div>
    );
  }
  if (response && !hasItems) return emptyBag;

  const signInPath = `/login?next=${encodeURIComponent("/checkout")}`;

  return (
    <>
      <div className="checkout_section">
        <div className="checkout_section_inner">
          <h1 className=" text-2xl  checkout_heading">Checkout</h1>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="checkout_Wrapper"
            noValidate
          >
            <div className="checkout_leftContainer">
              <GuestContactDetail
                register={register}
                setValue={setValue}
                control={control}
                errors={errors}
                signInPath={signInPath}
                onPrefill={prefillDelivery}
              />
              <Delivery
                control={control}
                errors={errors}
                register={register}
                setValue={setValue}
              />
              <BillingAddress
                register={register}
                setValue={setValue}
                control={control}
                errors={errors}
              />
              {formError && (
                <p className="guest_checkout_error text-base" role="alert">
                  <CouponMessage message={formError} reason={formErrorKey} />
                </p>
              )}
              <label className="">
                <p>
                  By continuing, I confirm that I have read and accept the{" "}
                  <Link href="/terms-of-service" target="_blank" className="text_decoration_underline ">
                    Terms and Conditions
                  </Link>{" "}
                  and the{" "}
                  <Link href="/privacy-policy" target="_blank" className="text_decoration_underline ">
                    Privacy Policy
                  </Link>
                </p>
              </label>
            </div>
            <OrderSummary
              data={cartData}
              session={isReserved ? checkout.session : null}
              loading={isBusy || !isReady}
              locked={isBusy}
              refetch={refetch}
              couponNotice={droppedCoupon.notice}
              guestId={visitorId}
              showContinue={!isReserved}
              continueLoading={isBusy || !isReady}
              canPay={isReserved && isReady}
              payLabel={canPayAgain ? "Pay again" : "Pay now"}
              payLoading={isReserved && isBusy}
              onPay={onPay}
            />
          </form>
        </div>
      </div>
      <Loader
        isLoading={
          ["placing", "verifying"].includes(checkout.step) || isLeaving
        }
      />
    </>
  );
};

export default GuestCheckout;
