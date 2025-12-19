import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema } from "@/validations/CheckoutValidation";
import { useMutation, useQuery } from "@apollo/client/react";
import { CART_LIST, CHECKOUT_ORDER } from "@/graphql";
import { EmailSubscribedStatus } from "@/utils/Constant";
import Checkout from "nimbbl_sonic";
import SeoHeader from "@/components/seo/SeoHeader";
import ContactDetail from "@/components/checkout/ContactDetail";
import Delivery from "@/components/checkout/Delivery";
import BillingAddress from "@/components/checkout/BillingAddress";
import OrderSummary from "@/components/checkout/OrderSummary";
import Loader from "@/components/checkout/Loader";
import Link from "next/link";


const CheckoutPage = ({ meta }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const { isLoggedIn, user } = useAuthStore((state) => state);
  const [checkoutOrder] = useMutation(CHECKOUT_ORDER);
  const cartListPayload = {
    cartId: router?.query?.id,
  };
  const {
    data: response,
    loading,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !router?.query?.id,
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
    if (isLoggedIn) {
      setValue("email", user?.email);
      setValue(
        "emailSubscribedStatus",
        user?.emailSubscribedStatus || EmailSubscribedStatus.NEVER_SUBSCRIBED
      );
    }
  }, [isLoggedIn]);

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
        await router.push(
          {
            pathname: redirectUrl,
            ...(awb_code ? { query: { awb_code } } : {}),
          },
          undefined,
          { shallow: true }
        );
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
      const checkout = new Checkout({ token });

      checkout.open({
        callback_handler: async function (response) {
          try {
            if (
              response?.event_type === "globalCloseCheckoutModal" &&
              response?.payload
            ) {
              await handleOrderPayment(response.payload);
            }
          } catch (err) {
            console.error("Error in callback_handler:", err);
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
      toast.error(err.message || "Failed");
    }
  };

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="checkout_section">
        <div className="checkout_section_inner">
          <h2 className=" text-2xl uppercase checkout_heading">Checkout</h2>
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
                  <a  href="/terms-of-service" target="_blank" className="text_decoration_underline ">
                    Terms and Conditions
                  </a >{" "}
                  and the{" "}
                  <a  href="/privacy-policy" target="_blank" className="text_decoration_underline ">
                    Privacy Policy
                  </a >
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

export default CheckoutPage;


export async function getServerSideProps({ params }) {
  const { id } = params;

  const isValidMongoId = /^[a-f\d]{24}$/i.test(id);

  if (!isValidMongoId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const meta = {
    title: "Checkout – Complete Your Nahara Jewellery Purchase",
    description: "Secure checkout for purchasing fine jewellery from Nahara. Fast delivery, trusted payments.",
    keywords: ["Nahara checkout", "jewellery checkout", "secure payment"],
    primaryKeywords: ["Nahara checkout"],
    author: "Nahara",
    robots: "noindex, nofollow",
    og: {
      title: "Checkout – Nahara Jewellery",
      description: "Complete your secure jewellery purchase.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Checkout – Nahara Jewellery",
      description: "Secure jewellery checkout.",
    }
  };

  return {
    props: {
      id,
      meta: meta,
    },
  };
}
