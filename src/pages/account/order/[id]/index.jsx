import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { GET_ORDER_BY_ID } from '@/graphql';
import { formatDateTime, formatePrice, renderVariants } from '@/utils/Util';

const OrderDetail = ({ meta }) => {
  const { id } = useParams();
  const { data: response, loading } = useQuery(GET_ORDER_BY_ID, { variables: { getClientSidePaymentByOrderIdId: id } });
  const data = response?.getClientSidePaymentByOrderId || [];
  if (loading) return;
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Order Details"} />
        <div className="account_rightSection">

          <h2 className="purchases_heading text-xl uppercase">Order details</h2>

          <div className="purchases_ordersList text-base">
            <div className="">
              <p className='uppercase bold text-base'>order number</p>
              <p className='text-base'>{data?.order?.orderNo}</p>
            </div>

            <div className="">
              <p className='uppercase bold text-base'>order date</p>
              <p className='text-base'>{formatDateTime(data?.order?.createdAt)}</p>
            </div>
            {/* <div className="">
              <p className='uppercase bold text-base'>Delivery date</p>
              <p className='text-base'>{order?.deliveryDate}</p>
            </div> */}

          </div>

          <div className="checkout_thin_line"></div>

          <div className="purchases_ordersList text-base">
            <div className="">
              <p className='uppercase bold text-base'>Amount Paid</p>
              <p className='text-base'>{formatePrice(data?.totalAmount)}</p>
            </div>
            <div className="">
              <p className='uppercase bold text-base'>Payment Method</p>
              <p className='text-base'>{data?.nimbblPaymentMode}</p>
            </div>
            <div className="">
              <p className='uppercase bold text-base'>Payment Status</p>
              <p className='text-base'>{data?.order?.paymentStatus}</p>
            </div>
            <div className="">
              <p className='uppercase bold text-base'>Shipment Status</p>
              <p className='text-base'>{data?.order?.shipmentStatus}</p>
            </div>

            <div className="">
              <p className='uppercase bold text-base'>Billing details</p>
              <p className='text-base'>{`${data?.order?.billingAddress?.firstname} ${data?.order?.billingAddress?.lastname}`}</p>
              <p className='text-base'>{data?.order?.billingAddress?.email}</p>
              <p className='text-base'>{data?.order?.billingAddress?.phone}</p>
              <p className='text-base'>{data?.order?.billingAddress?.addressType}</p>
            </div>

            <div className="">
              <p className='uppercase bold text-base'>Billing Address</p>
              <p className='text-base'>{data?.order?.billingAddress?.addressline1}</p>
              <p className='text-base'>{data?.order?.billingAddress?.addressline2}</p>
              <p className='text-base'>{`${data?.order?.billingAddress?.city}, ${data?.order?.billingAddress?.states}, ${data?.order?.billingAddress?.country} - ${data?.order?.billingAddress?.pincode}`}</p>
            </div>
            <div className="">
              <p className='uppercase bold text-base'>Shipping details</p>
              <p className='text-base'>{`${data?.order?.shippingAddress?.firstname} ${data?.order?.shippingAddress?.lastname}`}</p>
              <p className='text-base'>{data?.order?.shippingAddress?.email}</p>
              <p className='text-base'>{data?.order?.shippingAddress?.phone}</p>
              <p className='text-base'>{data?.order?.shippingAddress?.addressType}</p>
            </div>
            <div className="">
              <p className='uppercase bold text-base'>Shipping Address</p>
              <p className='text-base'>{data?.order?.shippingAddress?.addressline1}</p>
              <p className='text-base'>{data?.order?.shippingAddress?.addressline2}</p>
              <p className='text-base'>{`${data?.order?.shippingAddress?.city}, ${data?.order?.shippingAddress?.states}, ${data?.order?.shippingAddress?.country} - ${data?.order?.shippingAddress?.pincode}`}</p>
            </div>
          </div>

          <div className="checkout_thin_line"></div>

          <div className="purchases_ordersList text-base">
            <div className="">
              <p className='uppercase bold text-base'>Order summary</p>
              <div className="orderDetails_cartBag">
                {data?.order?.cart.map((item, index) => (
                  <div key={index} className="order_detailsBagItem">
                    <div className="cartBag_bagItemInner">
                      <div className="cartBag_bagImageWrapper">
                        <Link key={item?.product?._id} href={`/products/${item?.product?.slug}`} className='cartBag_bagImage'>
                          <img
                            className="cartBag_bagImage"
                            src={item?.asset?.path || ""}
                            alt={item?.asset?.altText || ""}
                          />
                        </Link>
                      </div>
                      <div className="cartBag_bagItemDetails">
                        <div className="cartBag_bagItemTop">
                          <div>
                            <p className="cartBag_itemName text-base">{item?.name || ""}</p>
                            {renderVariants(item?.product?.productOptions || [], item?.variantDetail?.selectedOptions || [])}
                          </div>
                          <p className='text-xl'>{formatePrice(item?.finalPrice || 0)}</p>
                        </div>
                        <div className="purchases_orderFooter_inner">
                          <Link scroll={false} href={`/products/${item?.product?.slug}`} className="text-sm">
                            <p className="text-sm">View Product</p>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="checkout_thin_line"></div>

          <div className="purchases_ordersList text-base">
            <p className='uppercase bold text-base'>Return & Refund Information</p>

            <div className="purchases_orderFooter_inner order_open_prdct">
              <Link scroll={false} href={`/shipping-returns`} className="text-sm">
                <p className="text-sm">Shipping & Returns</p>
              </Link>
            </div>

          </div>

        </div>
      </AccountLayout>
    </>
  );
};

export default OrderDetail;

export async function getServerSideProps({ params }) {
  const orderId = params?.id || "";
  const meta = {
    title: "Your Orders | Track & Manage Purchases – Nahara",
    description:
      "View and track all your Nahara jewellery orders in one place. Check order status, shipping updates, invoices, and more.",
    keywords: [
      "Nahara orders",
      "track order",
      "order history",
      "jewellery orders"
    ],
    primaryKeywords: ["orders", "order history"],
    author: "Nahara",
    robots: "noindex,nofollow",
    og: {
      title: "Your Orders | Nahara",
      description:
        "Track and manage all your jewellery orders at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Your Orders | Nahara",
      description:
        "View, track, and manage your Nahara jewellery orders.",
    }
  };
  return { props: { meta } };
}
