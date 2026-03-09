"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema } from "@/validations/CheckoutValidation";
import { useMutation, useQuery } from "@apollo/client/react";
import { CART_LIST, CHECKOUT_ORDER } from "@/graphql";
import { EmailSubscribedStatus } from "@/utils/Constant";
import Checkout from "nimbbl_sonic";
import ContactDetail from "@/components/checkout/ContactDetail";
import Delivery from "@/components/checkout/Delivery";
import BillingAddress from "@/components/checkout/BillingAddress";
import OrderSummary from "@/components/checkout/OrderSummary";
import Loader from "@/components/checkout/Loader";
import Link from "next/link";

const CheckoutClient = () => {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const { isLoggedIn, user } = useAuthStore((state) => state);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
  const callbackProcessedRef = useRef(false);

  const cartListPayload = {
    cartId: id,
  };

  const {
    data: response,
    loading,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !id,
    variables: cartListPayload,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const cartData = response?.getCart || {};

  const {
    register,
    handleSubmit,
    setValue,
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
      emailSubscribedStatus: EmailSubscribedStatus.SUBSCRIBED,
      useShippingAsBilling: true,
    },
  });

  useEffect(() => {
    if (isLoggedIn && user) {
      setValue("email", user?.email);
      setValue(
        "emailSubscribedStatus",
        user?.emailSubscribedStatus || EmailSubscribedStatus.NEVER_SUBSCRIBED
      );
    }
  }, [isLoggedIn, user, setValue]);

  const handleOrderPayment = async (payload) => {
    try {
      setIsPageLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/api/payment/handle-order-payment`,
        {
          method: "POST",
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            dbtoken: `Bearer ${process.env.NEXT_PUBLIC_DB_TOKEN || ""}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      const result = await response.json();
      const { redirectUrl, awb_code } = result.data || {};
      if (redirectUrl) {
        // Next.js 15 router.push for dynamic routes
        let targetUrl = redirectUrl;
        if (awb_code) {
          const urlObj = new URL(targetUrl, window.location.origin);
          urlObj.searchParams.set('awb_code', awb_code);
          targetUrl = urlObj.pathname + urlObj.search;
        }
        router.push(targetUrl);
        setIsPageLoading(false);
      }
    } catch (error) {
      console.error(`Error in Payment Order: ${error.message}`);
      setIsPageLoading(false);
      return null;
    }
  };

  const launchNimbblSonicCheckout = async (token) => {
    try {
      callbackProcessedRef.current = false;
      const checkout = new Checkout({ token });
      checkout.open({
        callback_handler: async function (response) {
          try {
            if (callbackProcessedRef.current) return;

            if (
              response?.event_type === "globalCloseCheckoutModal" &&
              response?.payload
            ) {
              callbackProcessedRef.current = true;
              await handleOrderPayment(response.payload);
            }
          } catch (err) {
            console.error("Error in callback_handler:", err);
            callbackProcessedRef.current = false;
          }
        },
      });
    } catch (error) {
      console.error("Error launching checkout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { email, emailSubscribedStatus, shippingAddress, billingAddress } =
        data;

      const payload = {
        userData: {
          firstName: shippingAddress.firstname,
          lastName: shippingAddress.lastname,
          email,
          phoneNumber: shippingAddress.phone,
          countryCode: shippingAddress.countryCode,
          emailSubscribedStatus,
        },
        cartId: cartData?._id,
        shippingAddress: { email, ...shippingAddress },
        billingAddress: { email, ...billingAddress },
      };

      const { data: response } = await checkoutOrder({
        variables: { input: payload },
      });
      const { token } = response?.clientCheckout?.nimbblData || {};
      launchNimbblSonicCheckout(token);
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      toast.error("Failed");
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
            <OrderSummary data={cartData} loading={isLoading} refetch={refetch} />
          </form>
        </div>
      </div>
      <Loader isLoading={isPageLoading} />
    </>
  );
};

export default CheckoutClient;
