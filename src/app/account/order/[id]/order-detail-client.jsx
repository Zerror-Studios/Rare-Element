"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { GET_ORDER_BY_ID } from '@/graphql';
import { formatDateTime, formatePrice, renderVariants } from '@/utils/Util';
import Image from 'next/image';

const OrderDetailClient = () => {
  const { id } = useParams();
  const { data: response, loading } = useQuery(GET_ORDER_BY_ID, { variables: { getClientSidePaymentByOrderIdId: id } });
  const data = response?.getClientSidePaymentByOrderId || {};

  if (loading) return <div className="account_rightSection">Loading order details...</div>;
  if (!data?.order) return <div className="account_rightSection">Order not found.</div>;

  return (
    <>
      <AccountBreadcrumb title={"Order Details"} />
      <div className="account_rightSection">

        <h1 className="purchases_heading text-xl uppercase">Order details</h1>

        <div className="purchases_ordersList text-base">
          <div className="">
            <p className='uppercase bold text-base'>order number</p>
            <p className='text-base'>{data?.order?.orderNo}</p>
          </div>

          <div className="">
            <p className='uppercase bold text-base'>order date</p>
            <p className='text-base'>{formatDateTime(data?.order?.createdAt)}</p>
          </div>
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

        <div className="purchases_ordersList text-base ">
          {data?.order?.invoiceUrl && (
            <div className="">
              <p className='uppercase bold text-base pb-1'>Invoice</p>
              <Link prefetch={false} href={data?.order?.invoiceUrl} target='_blank' className='text-base underline'>Download Invoice</Link>
            </div>
          )}
        </div>

        <div className="checkout_thin_line"></div>

        <div className="purchases_ordersList text-base">
          <div className="">
            <p className='uppercase bold text-base'>Order summary</p>
            <div className="orderDetails_cartBag">
              {data?.order?.cart?.map((item, index) => (
                <div key={index} className="order_detailsBagItem">
                  <div className="cartBag_bagItemInner">
                    <div className="cartBag_bagImageWrapper">
                      <Link prefetch scroll={false} key={item?.product?._id} href={`/products/${item?.product?.slug}`} className='cartBag_bagImage'>
                        <Image
                          width={150}
                          height={200}
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
                        <Link prefetch scroll={false} href={`/products/${item?.product?.slug}`} className="text-sm">
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
    </>
  );
};

export default OrderDetailClient;
