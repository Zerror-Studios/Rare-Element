"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import { useQuery } from '@apollo/client/react';
import { MY_ORDER } from '@/graphql';
import { formatDateTime, formatePrice, formatPaymentStatus } from '@/utils/Util';
import Image from 'next/image';
import OrderTracking from '@/components/account/orders/OrderTracking';
import OrderCancel from '@/components/account/orders/OrderCancel';
import OrderReturns from '@/components/account/orders/OrderReturns';
import { formatOrderDate, getOrderStatusLabel } from '@/utils/order-detail';

const OrderDetailClient = () => {
  const { id } = useParams();
  const { data: response, loading, error, refetch } = useQuery(MY_ORDER, { variables: { id }, skip: !id, fetchPolicy: 'network-only' });
  // Customer-scoped: another shopper's order id resolves to nothing.
  const data = { order: response?.myOrder };

  if (loading && !data?.order) return <div className="account_rightSection" role="status">Loading order details...</div>;
  if (error && !data?.order) {
    return (
      <div className="account_rightSection" role="alert">
        <p>We couldn't load this order. Please try again.</p>
        <button type="button" className="text-base underline order_link_btn" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }
  if (!data?.order) return <div className="account_rightSection">Order not found.</div>;

  // PRD-015 FR-18/FR-20: the server's display status, never derived here.
  const statusLabel = getOrderStatusLabel(
    data.order.displayStatus,
    formatPaymentStatus(data.order.paymentStatus),
  );
  const refresh = async () => {
    await refetch();
  };

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
            <p className='uppercase bold text-base'>Order Total</p>
            <p className='text-base'>{formatePrice(data?.order?.orderPrice)}</p>
          </div>
          <div className="">
            <p className='uppercase bold text-base'>Status</p>
            <p className='text-base order_status_pill'>{statusLabel}</p>
            {data?.order?.displayStatus === "CANCELLED" && data?.order?.cancelReason && (
              <p className='text-sm'>{data.order.cancelReason}</p>
            )}
            {data?.order?.deliveredAt && (
              <p className='text-sm'>{`Delivered ${formatOrderDate(data.order.deliveredAt)}`}</p>
            )}
          </div>
          <div className="">
            <p className='uppercase bold text-base'>Payment Status</p>
            <p className='text-base'>{formatPaymentStatus(data?.order?.paymentStatus)}</p>
          </div>
          <OrderTracking shipment={data?.order?.shipment} />
          {data?.order?.canCancel && (
            <OrderCancel orderId={data.order._id} onChanged={refresh} />
          )}

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
                      <Link prefetch={false} scroll={false} href={`/products/${item?.productId}`} className='cartBag_bagImage'>
                        <Image
                          width={150}
                          height={200}
                          sizes="150px"
                          className="cartBag_bagImage"
                          src={item?.asset?.path || "/green_logo.svg"}
                          alt={item?.asset?.altText || item?.name || ""}
                        />
                      </Link>
                    </div>
                    <div className="cartBag_bagItemDetails">
                      <div className="cartBag_bagItemTop">
                        <div>
                          <p className="cartBag_itemName text-base">{item?.name || ""}</p>
                          <p className="cartBag_itemSize text-sm">{`Qty - ${item?.qty || 1}`}</p>
                        </div>
                        <p className='text-xl'>{formatePrice(item?.finalPrice || 0)}</p>
                      </div>
                      <div className="purchases_orderFooter_inner">
                        <Link prefetch={false} scroll={false} href={`/products/${item?.productId}`} className="text-sm">
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
          <OrderReturns
            orderId={data.order._id}
            returnableItems={data.order.returnableItems || []}
            returnableUntil={data.order.returnableUntil}
            returnRequests={data.order.returnRequests || []}
            onChanged={refresh}
          />
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
