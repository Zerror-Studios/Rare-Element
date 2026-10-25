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
      awb_code
      courierName
      invoiceUrl
      createdAt
      updatedAt
    }
  }
`;
