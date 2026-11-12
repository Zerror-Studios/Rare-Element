"use client";

/**
 * The checkout page (`/checkout`): the signed-in customer's checkout, the
 * guest checkout or the sign-in prompt (backend PRD-041 FR-17).
 *
 * Both checkouts run on the kit's `useCheckout()` (kit 1.1.0): a signed-in
 * customer here with `start` → `pay`, a signed-out shopper in
 * `components/checkout/GuestCheckout.jsx` with `startGuest` → `pay`. The
 * kit opens the checkout session and waits for RESERVED, completes it (a
 * ₹0 order is placed PAID, COM-08), opens the store's payment app
 * (`launchPayment`; Nimbbl through the `nimbbl_sonic` registered in
 * `app/providers.jsx`), verifies and waits for PAID. It keeps the unpaid
 * order for a retry (`PendingOrderStore`, this tab) and sends the
 * checkout's GA4 events and the paid order's ads purchase itself.
 *
 * One flow on both paths (owner, 2026-11-12):
 * - "Continue to payment" validates the form and opens the session
 *   (`start` here, `startGuest` for a guest; its 15-minute stock hold only
 *   then, PRD-014 W0V2-02), waits for RESERVED and shows the server total
 *   in the summary. Never on page load.
 * - "Pay now" is enabled only while the session is reserved for exactly
 *   the bag, coupon and details on screen (`isReservedFor`); otherwise it
 *   is disabled with "Continue to payment to see your final total". Any
 *   change to the bag, coupon, email, addresses or the news box needs
 *   "Continue to payment" again. It places the order and opens the payment
 *   app (`pay`).
 * - A dismissed payment window keeps the order: a toast and "Pay again"
 *   (`retryPayment`); the kit sends GA4's `checkout_error` itself.
 *
 * Signed in (saved addresses):
 * - A kept unpaid order (also after a reload) is paid again while the bag
 *   and details match ("Continue to payment" reuses it: `start` finds it);
 *   changed details place a new order (the backend cancels the old one,
 *   PRD-015 FR-14). A changed bag or coupon drops the kept order.
 * - Once PAID: the order status page (`orderStatusPath`, FR-14), else
 *   `/checkout/thank-you?orderId=…`. A failed payment of a placed order:
 *   `/checkout/payment-failed?orderId=…` ("Retry payment"). A refusal that
 *   needs the bag or the address reviewed stays here with its message;
 *   `SHIPPING_UNAVAILABLE` focuses the delivery address.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema } from "@/validations/CheckoutValidation";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { CART_LIST, UPDATE_USER_PROFILE } from "@/graphql";
import { EmailSubscribedStatus } from "@/utils/Constant";
import ContactDetail from "@/components/checkout/ContactDetail";
import Delivery from "@/components/checkout/Delivery";
import BillingAddress from "@/components/checkout/BillingAddress";
import OrderSummary from "@/components/checkout/OrderSummary";
import Loader from "@/components/checkout/Loader";
import GuestCheckout from "@/components/checkout/GuestCheckout";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import Link from "next/link";
import { useAdsBeginCheckout } from "@/hooks/useAdsBeginCheckout";
import { useDroppedCouponCheck } from "@/hooks/useDroppedCouponCheck";
import CouponMessage from "@/components/checkout/CouponMessage";
import { getKitKeyMessage } from "@/utils/errors";
import {
  getCartFingerprint,
  getDetailsKey,
  isKeptOrderStale,
  isReservedFor,
  toCustomerCheckoutInput,
} from "@/utils/checkout-kit";
import {
  PendingOrderStore,
  checkoutFingerprint,
  orderStatusPath,
} from "@zcom/storefront-kit/core";
import {
  useCheckout,
  useSession,
  useStoreCheckoutOptions,
} from "@zcom/storefront-kit/client";

// ─── Constants ────────────────────────────────────────────────────────────

/** Answers after which the bag on screen is stale (refetched). */
const CART_REFRESH_KEYS = [
  "PRICE_CHANGED",
  "PROMOTION_INVALID",
  "OUT_OF_STOCK",
  "INSUFFICIENT_STOCK",
  "INVALID_ITEMS",
  "VARIANT_REQUIRED",
  "EMPTY_CART",
];
/** Answers that belong to the delivery address. */
const ADDRESS_KEYS = ["SHIPPING_UNAVAILABLE", "ADDRESS_REQUIRED"];
/** Failures with no placed order to retry (stay on this page). */
const NO_RETRY_KEYS = [
  "ORDER_CANCELLED",
  "ORDER_NOT_FOUND",
  "ORDER_NOT_PAYABLE",
  "NOT_FOUND",
];
/** The order (or its stock hold) is gone: the next attempt starts over. */
const START_OVER_KEYS = [
  "PRICE_CHANGED",
  "CHECKOUT_EXPIRED",
  "RESERVATION_RELEASED",
  "ORDER_CANCELLED",
];
// CustomerProfile.emailSubscribedStatus: 1 = opted in (0 out, 2 never).
const EMAIL_STATUS_SUBSCRIBED_CODE = 1;
const EMAIL_STATUS_UNSUBSCRIBED_CODE = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────

const isPromotionKey = (key) => String(key || "").startsWith("PROMOTION_");

/** The bag must be reviewed: stay here, never the payment-failed page. */
const needsBagReview = (key) =>
  CART_REFRESH_KEYS.includes(key) || isPromotionKey(key);

/** The kit's kept unpaid order, dropped when expired (`find` checks it). */
const readKeptOrder = () => {
  const kept = PendingOrderStore.get();
  return kept?.fingerprint ? PendingOrderStore.find(kept.fingerprint) : null;
};

// ─── Signed-in checkout ───────────────────────────────────────────────────

const CustomerCheckout = () => {
  const router = useRouter();
  const client = useApolloClient();
  const checkout = useCheckout();
  const { isLoggedIn, user, setUser } = useAuthStore((state) => state);
  const [isReady, setIsReady] = useState(false);
  // The details "Continue to payment" reserved; null until then
  const [reservedKey, setReservedKey] = useState(null);
  // True once the browser is leaving (status page, payment page)
  const [isLeaving, setIsLeaving] = useState(false);
  // Bumped to re-read the kit's kept order after we change it
  const [keptVersion, setKeptVersion] = useState(0);
  const startingRef = useRef(false);
  const payingRef = useRef(false);
  const cartFingerprintRef = useRef(null);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // The customer's own cart (owner from the token; no id in the URL, since
  // a guest cart gets a new id when it is merged at login).
  const {
    data: response,
    loading,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !isLoggedIn,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const cartData = response?.getCart || {};

  // The ads networks' begin checkout, once per page load (both paths);
  // the kit sends GA4's `begin_checkout` once reserved
  useAdsBeginCheckout(cartData);
  // A bag code the server dropped at "Continue to payment"
  const droppedCoupon = useDroppedCouponCheck(cartData, refetch);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    getValues,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      shippingAddress: {
        addressType: "",
        countryCode: "+91",
        country: "India",
        primary: true,
      },
      billingAddress: {
        addressType: "",
        countryCode: "+91",
        country: "",
        primary: false,
      },
      // PRD-014 FR-2.8 (UX-29): marketing email is opt-in, never pre-ticked;
      // the box shows the profile's own choice once it loads.
      emailSubscribedStatus: EmailSubscribedStatus.UNSUBSCRIBED,
      useShippingAsBilling: true,
    },
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      setValue("email", user?.email);
    }
  }, [isLoggedIn, user, setValue]);

  useEffect(() => {
    if (!isLoggedIn || user?.emailSubscribedStatus === undefined) return;
    setValue(
      "emailSubscribedStatus",
      user.emailSubscribedStatus === EMAIL_STATUS_SUBSCRIBED_CODE
        ? EmailSubscribedStatus.SUBSCRIBED
        : EmailSubscribedStatus.UNSUBSCRIBED,
    );
  }, [isLoggedIn, user?.emailSubscribedStatus, setValue]);

  // PRD-014 FR-2.8 (UX-29), as deveshe: the "Email me" box updates the
  // customer's own consent when "Pay now" is pressed. Best effort: a
  // failure never blocks payment, and nothing is written when the box
  // matches.
  const saveEmailPreference = (status) => {
    const wantsEmail = status === EmailSubscribedStatus.SUBSCRIBED;
    const isSubscribed =
      user?.emailSubscribedStatus === EMAIL_STATUS_SUBSCRIBED_CODE;
    if (wantsEmail === isSubscribed) return;
    client
      .mutate({
        mutation: UPDATE_USER_PROFILE,
        variables: {
          input: {
            emailSubscribedStatus: wantsEmail
              ? EMAIL_STATUS_SUBSCRIBED_CODE
              : EMAIL_STATUS_UNSUBSCRIBED_CODE,
          },
        },
      })
      .then(({ data }) => {
        if (data?.updateMyProfile) setUser({ ...user, ...data.updateMyProfile });
      })
      .catch(() => {});
  };

  // ─── Details, reservation and the kept order ────────────────────────────

  const [
    watchedEmail,
    watchedShipping,
    watchedBilling,
    watchedUseShippingAsBilling,
    watchedEmailStatus,
  ] = useWatch({
    control,
    name: [
      "email",
      "shippingAddress",
      "billingAddress",
      "useShippingAsBilling",
      "emailSubscribedStatus",
    ],
  });
  const cartFingerprint = cartData?._id ? getCartFingerprint(cartData) : null;
  // Built from the raw form values (the parsed ones drop a saved address's
  // flat), exactly as `start` receives them
  const inputOf = (values) => toCustomerCheckoutInput(cartData, values);
  // The news box is part of the details: a change needs Continue again
  const keyOf = (input, emailStatus, fingerprint = cartFingerprint) =>
    getDetailsKey(fingerprint, [input, emailStatus ?? null]);
  const detailsInput = inputOf({
    email: watchedEmail,
    shippingAddress: watchedShipping,
    billingAddress: watchedBilling,
    useShippingAsBilling: watchedUseShippingAsBilling,
  });
  const detailsKey = keyOf(detailsInput, watchedEmailStatus);

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

  // The kit's kept unpaid order of this bag (read after mount: storage)
  const keptOrder = useMemo(
    () => (isReady ? readKeptOrder() : null),
    [isReady, keptVersion, checkout.step], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const hasPendingOrder =
    Boolean(keptOrder && cartData?._id) && !isKeptOrderStale(keptOrder, cartData);
  const isPendingOrderDetails =
    hasPendingOrder &&
    keptOrder.fingerprint === checkoutFingerprint(detailsInput);

  const forgetKeptOrder = () => {
    PendingOrderStore.clear();
    setKeptVersion((version) => version + 1);
  };

  // A changed bag or coupon: the shown total and the kept order no longer
  // match it (the kit's fingerprint has the lines, not the coupon), so both
  // are dropped; on load, a kept order of another bag or coupon too
  useEffect(() => {
    if (!cartFingerprint) return;
    const previous = cartFingerprintRef.current;
    cartFingerprintRef.current = cartFingerprint;
    if (previous && previous !== cartFingerprint) {
      // The server's own drop of a code that no longer applies keeps the
      // session (its total is the one shown)
      if (droppedCoupon.isExpectedChange(cartFingerprint)) return;
      droppedCoupon.clear();
      setReservedKey(null);
      forgetKeptOrder();
      return;
    }
    if (isKeptOrderStale(readKeptOrder(), cartData)) forgetKeptOrder();
  }, [cartFingerprint, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // The server pricing in the summary: the reserved session's, else the
  // kept order's own while the details match; never an estimate as final
  const shownPricing = isReserved
    ? checkout.pricing
    : isPendingOrderDetails
      ? keptOrder.session?.pricing ?? null
      : null;

  // ─── Failures ───────────────────────────────────────────────────────────

  /** The kit's refusal → the store's message, at the right place. */
  const handleFailure = (key) => {
    if (!key) return;
    if (START_OVER_KEYS.includes(key)) {
      setReservedKey(null);
      forgetKeptOrder();
    }
    if (needsBagReview(key)) refetch();
    toast.error(<CouponMessage message={getKitKeyMessage(key)} reason={key} />);
    // The address is outside every shipping zone: let the shopper fix it
    if (ADDRESS_KEYS.includes(key)) setFocus("shippingAddress.states");
  };

  // `start` answers null on a refusal; its key is in the kit's state
  useEffect(() => {
    if (checkout.step !== "failed" || !checkout.error) return;
    if (!startingRef.current) return;
    startingRef.current = false;
    handleFailure(checkout.error);
  }, [checkout.step, checkout.error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Payment results ────────────────────────────────────────────────────

  /** Where a finished payment goes: the status page, else thank-you. */
  const goAfterPayment = (result) => {
    const path = orderStatusPath(result.statusToken);
    setIsLeaving(true);
    router.replace(
      path ||
        (result.orderId
          ? `/checkout/thank-you?orderId=${encodeURIComponent(result.orderId)}`
          : "/checkout/thank-you"),
    );
  };

  const handlePayResult = (result) => {
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
    const kept = PendingOrderStore.get();
    if (
      result.orderId &&
      kept?.orderId === result.orderId &&
      !NO_RETRY_KEYS.includes(result.reason) &&
      !needsBagReview(result.reason)
    ) {
      setIsLeaving(true);
      const params = new URLSearchParams({
        orderId: result.orderId,
        reason: "FAILED",
      });
      router.push(`/checkout/payment-failed?${params.toString()}`);
      return;
    }
    setKeptVersion((version) => version + 1);
    handleFailure(result.reason);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────

  /** "Continue to payment" (after validation): reserves these details. */
  const onContinue = async () => {
    if (isBusy) return;
    if (!cartData?._id || !cartData?.cart?.length) {
      toast.error(
        loading
          ? "Your bag is still loading. Please try again in a moment."
          : getKitKeyMessage("EMPTY_CART"),
      );
      return;
    }
    // Raw values (see `inputOf`): a saved address keeps every field
    const values = getValues();
    const input = inputOf(values);
    startingRef.current = true;
    const session = await checkout.start(input);
    if (!session) return;
    startingRef.current = false;
    const fingerprint = await droppedCoupon.check(session);
    setReservedKey(keyOf(input, values.emailSubscribedStatus, fingerprint));
  };

  /** "Pay now" (reserved for these details): places the order and pays. */
  const onPay = async () => {
    if (payingRef.current || isBusy || !isReserved) return;
    payingRef.current = true;
    try {
      let result;
      if (canPayAgain) {
        result = await checkout.retryPayment(checkout.orderId);
      } else {
        saveEmailPreference(getValues("emailSubscribedStatus"));
        result = await checkout.pay();
      }
      handlePayResult(result);
    } finally {
      payingRef.current = false;
    }
  };

  // Enter in the form: "Pay now" once reserved, else "Continue to payment"
  const onSubmit = () => (isReserved ? onPay() : onContinue());

  return (
    <>
      <div className="checkout_section">
        <div className="checkout_section_inner">
          <h1 className=" text-2xl  checkout_heading">Checkout</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="checkout_Wrapper">
            <div className="checkout_leftContainer">

              <ContactDetail
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
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
              {isPendingOrderDetails && (
                <p className="guest_checkout_note text-base" role="status">
                  Your order is saved. Continue to payment, then pay to retry
                  the payment with the same delivery details.
                </p>
              )}
              {hasPendingOrder && !isPendingOrderDetails && (
                <p className="guest_checkout_note text-base" role="status">
                  You changed the details of your saved order. Paying places
                  a new order with these details; continue to payment to see
                  its final total.
                </p>
              )}
              <label className="">
                <p>
                  By continuing, I confirm that I have read and accept the{" "}
                  <Link href="/terms-of-service" target="_blank" className="text_decoration_underline ">
                    Terms and Conditions
                  </Link >{" "}
                  and the{" "}
                  <Link href="/privacy-policy" target="_blank" className="text_decoration_underline ">
                    Privacy Policy
                  </Link >
                </p>
              </label>
            </div>
            <OrderSummary
              data={cartData}
              session={shownPricing ? { pricing: shownPricing } : null}
              loading={isBusy || !isReady}
              locked={isBusy}
              refetch={refetch}
              couponNotice={droppedCoupon.notice}
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
          ["reserving", "placing", "verifying"].includes(checkout.step) ||
          isLeaving
        }
      />
    </>
  );
};

// ─── Path (backend PRD-041 FR-17) ─────────────────────────────────────────

/** Signed out on a store whose accounts are REQUIRED (PRD-041 FR-3). */
const SignInToCheckout = () => {
  const next = "/checkout";
  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl font-bold">Sign in to check out</h1>
        <p className="uppercase mt-2">
          Sign in with your email to check out. Your bag is saved and comes
          with you.
        </p>
        <div className="w-full">
          <GreenBoxBtn
            type="button"
            title="Sign in"
            href={`/login?next=${encodeURIComponent(next)}`}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * The checkout for who is here: the customer's (kit session `customer`),
 * the guest's (accounts OPTIONAL) or the sign-in prompt (REQUIRED). The
 * page loader shows while the session or the store's options are read.
 */
const CheckoutClient = () => {
  const { status } = useSession();
  const { allowsGuest, loading } = useStoreCheckoutOptions();
  if (status === "customer") return <CustomerCheckout />;
  if (status === "unknown" || loading) return <Loader isLoading />;
  return allowsGuest ? <GuestCheckout /> : <SignInToCheckout />;
};

export default CheckoutClient;
