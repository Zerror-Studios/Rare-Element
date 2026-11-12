"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MY_ORDERS } from "@/graphql";
import { formatDateTime, formatePrice, formatPaymentStatus } from "@/utils/Util";
import { getShipmentStatusLabel } from "@zcom/storefront-kit/core";
import { getOrderStatusLabel } from "@/utils/order-detail";

const OrderList = () => {
  const LIMIT = 100;
  const [offset, setOffset] = useState(0);

  // Customer-scoped: the owner comes from the access token.
  const { data: response, loading } = useQuery(MY_ORDERS, {
    variables: { limit: LIMIT, offset },
    fetchPolicy: "network-only",
  });
  const { orders: data = [], totalCount = 0 } = response?.myOrders || {};
  return (
    <div className="purchases_ordersList">
      {!loading && data.length === 0 && (
        <div className="wishlist_empty_box_inner">
          <p className="text-xl ">No orders found</p>
          <Link href="/products" className="text_decoration_underline">
            Go to Shopping
          </Link>
        </div>
      )}
      {data?.map((item) => {
        const cart = item?.cart && item?.cart?.length > 0 ? item?.cart : [];
        // Our shipment status (backend PRD-044), never the provider's wording
        const shipmentLabel = getShipmentStatusLabel(item?.trackingStatus);
        return (
          <div key={item?._id} className="purchases_orderCard">
            <p className='text-base'>Order: {item?.orderNo}</p>
            {/* PRD-015 FR-18: the server's display status when present */}
            <p className="purchases_status text-base">{getOrderStatusLabel(item?.displayStatus, `${formatPaymentStatus(item?.paymentStatus)}${shipmentLabel ? ` - ${shipmentLabel}` : ""}`)}</p>

            <div>
              <p>{formatDateTime(item?.createdAt || "")}</p>
              <p className="purchases_amount text-base">{formatePrice(item?.orderPrice || 0)}</p>
            </div>

            <div className="purchases_itemsGrid">
              {cart?.map((cartItem, cartIndex) => {
                return (
                  <div key={`order-product-${cartIndex}`} className="purchases_itemBox">
                    <Image
                      width={150}
                      height={200}
                      sizes="150px"
                      className="purchases_itemImg"
                      src={cartItem?.asset?.path || "/green_logo.svg"}
                      alt={cartItem?.asset?.altText || cartItem?.name || ""}
                    />
                  </div>
                )
              })}
            </div>

            <div className="purchases_orderFooter">
              <p className="purchases_itemCount text-base">{cart.length} Items</p>
              <div className="purchases_orderFooter_inner">
                <Link prefetch scroll={false} href={`/account/order/${item?._id}`} className="text-sm">
                  <p className="text-sm">View order</p>
                </Link>
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}

export default OrderList