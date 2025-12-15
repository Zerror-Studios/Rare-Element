import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { useAuthStore } from "@/store/auth-store";
import { ORDER_LIST } from "@/graphql";
import { formatDateTime, formatePrice } from "@/utils/Util";
import Image from "next/image";

const OrderList = () => {
  const LIMIT = 100;
  const [offset, setOffset] = useState(0);
  const { user } = useAuthStore((state) => state);

  const payload = {
    filter: { userId: user?._id },
    limit: LIMIT,
    offset,
  };
  const { data: response, loading } = useQuery(ORDER_LIST, {
    variables: payload,
  });
  const { data = [], totalCount = 0 } = response?.getOrdersByFilters || {};
  if (!data || data.length === 0) null;
  return (
    <div className="purchases_ordersList">
      {data.length === 0 && <p className="text-xl">No orders found</p>}
      {data?.map((item) => {
        const cart = item?.cart && item?.cart?.length > 0 ? item?.cart : [];
        return (
          <div key={item?._id} className="purchases_orderCard">
            <p className='text-base'>Order: {item?.orderNo}</p>
            <p className="purchases_status text-base">{`${item?.paymentStatus} ${item?.shipmentStatus ? ` - ${item?.shipmentStatus}` : ""}`}</p>

            <div>
              <p>{formatDateTime(item?.createdAt || "")}</p>
              <p className="purchases_amount text-base">{formatePrice(item?.discountedPrice || 0)}</p>
            </div>

            <div className="purchases_itemsGrid">
              {cart?.map((cartItem, cartIndex) => {
                return (
                  <>
                    <div key={`order-product-${cartIndex}`} className="purchases_itemBox">
                      <Image
                        width={150}
                        height={200}
                        className="purchases_itemImg"
                        src={cartItem?.asset?.path || ""}
                        alt={cartItem?.asset?.altText || ""}
                      />
                    </div>
                  </>
                )
              })}
            </div>

            <div className="purchases_orderFooter">
              <p className="purchases_itemCount text-base">{cart.length} Items</p>
              <div className="purchases_orderFooter_inner">
                <Link scroll={false} href={`/account/order/${item?._id}`} className="text-sm">
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