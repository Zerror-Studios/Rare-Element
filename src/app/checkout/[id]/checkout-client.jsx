"use client";

/**
 * Checkout (PRD-002 SF-1 / SF-12, storefront contract §1)
 *
 * 1. createCheckoutSessionFromCart (server prices the cart, asks for a
 *    stock hold) → poll getCheckoutSession until RESERVED; stop on FAILED
 *    (e.g. OUT_OF_STOCK) or EXPIRED.
 * 2. completeCheckout → orderId (UN_PAID order, idempotent per session).
 * 3. createPaymentSession({ orderId }) → a provider-neutral `checkout` on
 *    the store's active payment app (server amount, PRD-011).
 * 4. `openPaymentCheckout`: Razorpay / Cashfree / Nimbbl window → response
 *    → verifyPayment (server-to-server); PayU posts back to
 *    `/api/payments/return` → `/checkout/payment-return`.
 * 5. thank-you?orderId=… (PAID or pending), payment-failed otherwise.
 *
 * A ₹0 total (PRD-014 COM-08) is placed PAID by `completeCheckout`, so
 * steps 3–4 are skipped and the shopper goes straight to thank-you.
 * `SHIPPING_UNAVAILABLE` keeps the form open and focuses the address so
 * the shopper can change it.
 *
 * "Pay Now" stays disabled from submit until the provider answers (or a
 * failure); the response is processed once. A dismissed payment window
 * keeps the order, so "Pay Now" retries the payment for the same order.
 * The pending order id survives a reload (`utils/pending-order.js`,
 * RBUG-8) and is dropped on success, or when the bag or coupon changes or
 * the server reports the hold or order gone. A retry with a changed email
 * or address places a new order with the new details (VBUG-4).
 */

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema } from "@/validations/CheckoutValidation";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
  CART_LIST,
  COMPLETE_CHECKOUT,
  CREATE_CHECKOUT_SESSION,
  CREATE_PAYMENT_SESSION,
  GET_CHECKOUT_SESSION,
  UPDATE_USER_PROFILE,
  VERIFY_PAYMENT,
} from "@/graphql";
import { EmailSubscribedStatus } from "@/utils/Constant";
import { openPaymentCheckout } from "@/utils/payment-checkout";
import ContactDetail from "@/components/checkout/ContactDetail";
import Delivery from "@/components/checkout/Delivery";
import BillingAddress from "@/components/checkout/BillingAddress";
import OrderSummary from "@/components/checkout/OrderSummary";
import Loader from "@/components/checkout/Loader";
import Link from "next/link";
import { trackEcomEvent } from "@/utils/analytics";
import { getErrorInfo, getErrorMessage, getReasonMessage } from "@/utils/errors";
import { PendingOrder } from "@/utils/pending-order";
import { getCheckoutTrackingVariables } from "@/utils/ad-click-ids";
import {
  CheckoutStepEnum,
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackCheckoutError,
} from "@/utils/analytics-events";

// ─── Constants ────────────────────────────────────────────────────────────

const RESERVATION_POLL_INTERVAL_MS = 1000;
const RESERVATION_TIMEOUT_MS = 30 * 1000;
// The order (or its stock hold) is gone: the next attempt starts over.
const ORDER_RESET_REASONS = [
  "PRICE_CHANGED",
  "CHECKOUT_EXPIRED",
  "RESERVATION_RELEASED",
  "ORDER_CANCELLED",
];
// CustomerProfile.emailSubscribedStatus: 1 = opted in (0 out, 2 never).
const EMAIL_STATUS_SUBSCRIBED_CODE = 1;
const EMAIL_STATUS_UNSUBSCRIBED_CODE = 0;
const ORDER_ADDRESS_FIELDS = [
  "firstname",
  "lastname",
  "email",
  "addressType",
  "flat",
  "addressline1",
  "addressline2",
  "landmark",
  "phone",
  "countryCode",
  "city",
  "country",
  "states",
  "pincode",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The OrderAddressInput subset of a form/saved address. */
const toOrderAddress = (address = {}, email) => {
  const result = {};
  ORDER_ADDRESS_FIELDS.forEach((field) => {
    const value = address?.[field];
    if (value !== undefined && value !== null && value !== "") {
      result[field] = String(value);
    }
  });
  if (!result.email && email) result.email = email;
  return result;
};

/** Email and both order addresses exactly as sent to the server. */
const toCheckoutDetails = (formData) => {
  const { email, shippingAddress, billingAddress, useShippingAsBilling } =
    formData;
  return {
    email,
    shippingAddress: toOrderAddress(shippingAddress, email),
    billingAddress: toOrderAddress(
      useShippingAsBilling ? shippingAddress : billingAddress,
      email,
    ),
  };
};

const CheckoutClient = () => {
  const router = useRouter();
  const client = useApolloClient();
  const [isPaying, setIsPaying] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [session, setSession] = useState(null);
  const { isLoggedIn, user, setUser } = useAuthStore((state) => state);
  const [createCheckoutSession] = useMutation(CREATE_CHECKOUT_SESSION);
  const [completeCheckout] = useMutation(COMPLETE_CHECKOUT);
  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);
  const callbackProcessedRef = useRef(false);
  // `{ orderId, detailsFingerprint }` of the unpaid order, or null.
  const [pendingOrder, setPendingOrder] = useState(null);
  const beginCheckoutTrackedRef = useRef(false);
  // PRD-013: add_shipping_info once per visit; the payment app for errors.
  const shippingInfoTrackedRef = useRef(false);
  const paymentProviderRef = useRef(null);

  // The customer's own cart (owner from the token; the URL id is cosmetic,
  // since a guest cart gets a new id when it is merged at login).
  const {
    data: response,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !isLoggedIn,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const cartData = response?.getCart || {};

  // Restore the unpaid order after a reload; a changed bag drops it.
  useEffect(() => {
    if (!cartData?._id) return;
    setPendingOrder(PendingOrder.read(cartData));
  }, [cartData]);

  const forgetPendingOrder = () => {
    PendingOrder.clear(cartData?._id);
    setPendingOrder(null);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (beginCheckoutTrackedRef.current || !cartData?.cart?.length) return;
    beginCheckoutTrackedRef.current = true;
    trackEcomEvent.beginCheckout(cartData.cart, cartData.discountedPrice);
  }, [cartData]);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
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
  // customer's own consent once the order exists. Best effort: a failure
  // never blocks payment, and nothing is written when the box matches.
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

  // ─── Failure routing ────────────────────────────────────────────────────

  const goToPaymentFailed = (orderId, reason) => {
    const params = new URLSearchParams();
    if (orderId) params.set("orderId", orderId);
    if (reason) params.set("reason", reason);
    router.replace(`/checkout/payment-failed?${params.toString()}`);
  };

  const stopWithMessage = (message) => {
    toast.error(message);
    setIsPaying(false);
    setIsPageLoading(false);
  };

  // ─── Step 4: verify the provider's response ─────────────────────────────

  const handlePaymentResponse = async (orderId, payload) => {
    try {
      setIsPageLoading(true);
      const { data } = await verifyPayment({ variables: { payload } });
      const result = data?.verifyPayment || {};
      const verifiedOrderId = result.orderId || orderId;

      if (result.success || result.status === "PENDING") {
        // PAID is confirmed asynchronously; thank-you reads myOrder.
        forgetPendingOrder();
        router.replace(`/checkout/thank-you?orderId=${verifiedOrderId}`);
        return;
      }
      trackCheckoutError(
        CheckoutStepEnum.PAYMENT,
        result.status || "FAILED",
        paymentProviderRef.current,
      );
      goToPaymentFailed(verifiedOrderId, result.status || "FAILED");
    } catch (error) {
      console.error("Payment verification failed:", error);
      const { reason, code } = getErrorInfo(error);
      if (reason === "ALREADY_PAID") {
        forgetPendingOrder();
        router.replace(`/checkout/thank-you?orderId=${orderId}`);
        return;
      }
      trackCheckoutError(
        CheckoutStepEnum.PAYMENT,
        reason || code || "VERIFY_FAILED",
        paymentProviderRef.current,
      );
      goToPaymentFailed(orderId, "VERIFY_FAILED");
    }
  };

  // ─── Step 3b: open the payment app ──────────────────────────────────────

  const launchPaymentCheckout = async (payment, orderId) => {
    callbackProcessedRef.current = false;
    await openPaymentCheckout(payment, {
      onResult: async (payload) => {
        if (callbackProcessedRef.current) return;
        callbackProcessedRef.current = true;
        await handlePaymentResponse(orderId, payload);
      },
      onDismiss: () => {
        if (callbackProcessedRef.current) return;
        callbackProcessedRef.current = true;
        // Closed without a result: the order stays; "Pay Now" retries it.
        trackCheckoutError(
          CheckoutStepEnum.PAYMENT,
          "PAYMENT_DISMISSED",
          paymentProviderRef.current,
        );
        setIsPaying(false);
        toast.info("Payment was not completed. You can try again.");
      },
    });
  };

  // ─── Steps 1–2: reserve and create the order ────────────────────────────

  const waitForReservation = async (created) => {
    let current = created;
    const deadline = Date.now() + RESERVATION_TIMEOUT_MS;
    while (current?.status === "PENDING" && Date.now() < deadline) {
      await wait(RESERVATION_POLL_INTERVAL_MS);
      const { data } = await client.query({
        query: GET_CHECKOUT_SESSION,
        variables: { id: created.id },
        fetchPolicy: "network-only",
      });
      current = data?.getCheckoutSession || current;
    }
    return current;
  };

  const placeOrder = async (details) => {
    const tracking = getCheckoutTrackingVariables();
    const { data } = await createCheckoutSession({
      variables: {
        cartId: cartData?._id,
        shippingAddress: details.shippingAddress,
        billingAddress: details.billingAddress,
        // PRD-012: GA ids and UTMs (analytics consent); PRD-034 FR-1.4:
        // ad click ids and _fbp/_fbc (marketing consent) and the consent
        // snapshot itself, always
        attribution: tracking.attribution,
        consent: tracking.consent,
      },
    });
    const created = data?.createCheckoutSessionFromCart;
    if (!created?.id) throw new Error("No checkout session");

    const reserved = await waitForReservation(created);
    setSession(reserved);

    if (reserved?.status === "FAILED") {
      trackCheckoutError(
        CheckoutStepEnum.ADDRESS,
        reserved.failureReason || "RESERVATION_ERROR",
      );
      stopWithMessage(
        getReasonMessage(
          reserved.failureReason,
          "We couldn't reserve your items. Please review your bag.",
        ),
      );
      refetch();
      return null;
    }
    if (reserved?.status === "EXPIRED") {
      trackCheckoutError(CheckoutStepEnum.ADDRESS, "CHECKOUT_EXPIRED");
      stopWithMessage(getReasonMessage("CHECKOUT_EXPIRED"));
      return null;
    }
    if (reserved?.status !== "RESERVED") {
      trackCheckoutError(CheckoutStepEnum.ADDRESS, "RESERVATION_PENDING");
      stopWithMessage(
        "Reserving your items is taking longer than usual. Please try again.",
      );
      return null;
    }

    const { data: completed } = await completeCheckout({
      variables: { checkoutId: reserved.id },
    });
    const result = completed?.completeCheckout;
    if (!result?.orderId) throw new Error("No order created");
    // COM-08: the server placed a ₹0 order PAID; there is nothing to pay.
    return { orderId: result.orderId, isFree: result.pricing?.total === 0 };
  };

  // ─── Submit ─────────────────────────────────────────────────────────────

  const onSubmit = async (formData) => {
    if (isPaying) return;
    if (!cartData?._id || !cartData?.cart?.length) {
      toast.error(getReasonMessage("EMPTY_CART"));
      return;
    }
    setIsPaying(true);
    setIsPageLoading(true);

    const details = toCheckoutDetails(formData);
    // PRD-013 Q3: the validated form is the address step's completion.
    if (!shippingInfoTrackedRef.current) {
      shippingInfoTrackedRef.current = true;
      trackAddShippingInfo(
        cartData,
        cartData?.isFreeShippingEnabled ? "free" : "standard",
      );
    }
    let orderId = null;
    if (PendingOrder.matches(pendingOrder, details)) {
      orderId = pendingOrder.orderId;
    } else if (pendingOrder) {
      // VBUG-4: the email or an address changed after the payment window
      // was closed, so the unpaid order (and its details) is not reused.
      forgetPendingOrder();
    }
    try {
      if (!orderId) {
        const placed = await placeOrder(details);
        if (!placed) return;
        orderId = placed.orderId;
        saveEmailPreference(formData.emailSubscribedStatus);
        if (placed.isFree) {
          forgetPendingOrder();
          router.replace(`/checkout/thank-you?orderId=${orderId}`);
          return;
        }
        setPendingOrder(PendingOrder.save(cartData, orderId, details));
      }

      const { data } = await createPaymentSession({
        variables: { input: { orderId } },
      });
      const payment = data?.createPaymentSession || {};
      paymentProviderRef.current =
        payment.checkout?.provider?.toLowerCase() || null;
      setIsPageLoading(false);

      if (!payment.checkout) {
        trackCheckoutError(CheckoutStepEnum.PAYMENT, "NO_PAYMENT_SESSION");
        goToPaymentFailed(orderId, "NO_PAYMENT_SESSION");
        return;
      }
      // PRD-013 Q3: the payment window is the payment step.
      trackAddPaymentInfo(cartData, paymentProviderRef.current);
      await launchPaymentCheckout(payment, orderId);
    } catch (err) {
      console.error(err);
      const { reason, code } = getErrorInfo(err);
      if (reason === "ALREADY_PAID" && orderId) {
        forgetPendingOrder();
        router.replace(`/checkout/thank-you?orderId=${orderId}`);
        return;
      }
      // Before an order exists the failure belongs to the address step.
      trackCheckoutError(
        orderId ? CheckoutStepEnum.PAYMENT : CheckoutStepEnum.ADDRESS,
        reason || code || "CHECKOUT_FAILED",
        orderId ? paymentProviderRef.current : undefined,
      );
      if (ORDER_RESET_REASONS.includes(reason)) {
        forgetPendingOrder();
        refetch();
      }
      stopWithMessage(getErrorMessage(err, "Checkout failed. Please try again."));
      // The address is outside every shipping zone: let the shopper fix it.
      if (reason === "SHIPPING_UNAVAILABLE") setFocus("shippingAddress.states");
    }
  };

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
              session={session}
              loading={isPaying}
              locked={isPaying || !!pendingOrder}
              refetch={refetch}
            />
          </form>
        </div>
      </div>
      <Loader isLoading={isPageLoading} />
    </>
  );
};

export default CheckoutClient;
