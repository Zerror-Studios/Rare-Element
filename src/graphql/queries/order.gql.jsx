import { gql } from "@apollo/client";

// Customer-scoped order history (the owner comes from the access token).
export const MY_ORDERS = gql`
  query MyOrders($limit: Int, $offset: Int) {
    myOrders(limit: $limit, offset: $offset) {
      orders {
        _id
        orderNo
        orderPrice
        paymentStatus
        fulfillmentStatus
        shipmentStatus
        displayStatus
        currency
        itemcount
        totalprice
        discountedPrice
        totalDiscount
        shippingAmount
        cart {
          productId
          variantId
          name
          sku
          qty
          price
          finalPrice
          asset {
            path
            altText
          }
        }
        createdAt
      }
      totalCount
    }
  }
`;

// PRD-015 FR-20: the order detail page. Status, tracking, cancel and
// returns are server-computed fields (`displayStatus`, `shipment`,
// `canCancel`, `returnableItems`); the deprecated `awb_code`,
// `courierName` and `trackInfo` are not selected.
export const MY_ORDER = gql`
  query MyOrder($id: ID!) {
    myOrder(id: $id) {
      _id
      orderNo
      orderPrice
      paymentStatus
      fulfillmentStatus
      currentStatus
      shipmentStatus
      currency
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      shippingAmount
      tax {
        totalTax
        pricesIncludeTax
      }
      promotion {
        promotionCode
        discount
      }
      cart {
        id
        productId
        variantId
        name
        sku
        qty
        price
        finalPrice
        asset {
          _id
          path
          altText
        }
      }
      billingAddress {
        firstname
        lastname
        email
        addressType
        flat
        addressline1
        addressline2
        landmark
        phone
        countryCode
        city
        country
        states
        pincode
      }
      shippingAddress {
        firstname
        lastname
        email
        addressType
        flat
        addressline1
        addressline2
        landmark
        phone
        countryCode
        city
        country
        states
        pincode
      }
      invoiceUrl
      displayStatus
      cancelReason
      deliveredAt
      canCancel
      shipment {
        awb
        courier
        trackingUrl
        tracking
      }
      returnableUntil
      returnableItems {
        orderItemId
        productId
        variantId
        name
        qty
        returnRequestedQty
        returnableQty
      }
      returnRequests {
        id
        status
        refundAmount
        createdAt
        items {
          orderItemId
          name
          quantity
          reason
          condition
        }
      }
      createdAt
      updatedAt
    }
  }
`;
