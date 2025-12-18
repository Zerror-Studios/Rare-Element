import { gql } from "@apollo/client";

export const ORDER_LIST = gql`
  query GetOrdersByFilters($offset: Int, $limit: Int, $filter: OrderFilterInput) {
  getOrdersByFilters(offset: $offset, limit: $limit, filter: $filter) {
    data {
      _id
      orderNo
      orderPrice
      paymentStatus
      currency
      fulfillmentStatus
      taxAmount
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      awb_code
      shipmentStatus
      cart {
        name
        description
        asset {
          _id
          path
          type
          isFeatured
          altText
        }
        qty
        freeQty
        price
        variantDetail {
          variantDetailId
          selectedOptions
          priceDifference
          variantPrice
          variantCostOfGoods
          shippingWeight
          sku
          trackInventory
          stockQuantity
          stockStatus
          status
        }
        finalPrice
        customTexts
        productId
        product {
          _id
          name
          slug
          productOptions {
            optionName
            choices {
              name
            }
            showInProductPageAs
          }
        }
      }
      nimbblInvoiceId
      customDiscount {
        amount
        discountReason
      }
      customFee {
        amount
        name
      }
      createdAt
      updatedAt
      shippingAmount
    }
    totalCount
  }
}
`;

export const GET_ORDER_BY_ID = gql`
query GetClientSidePaymentByOrderId($getClientSidePaymentByOrderIdId: ID!) {
  getClientSidePaymentByOrderId(id: $getClientSidePaymentByOrderIdId) {
    _id
    currentStatus
    nimbblPaymentMode
    nimbblPaymentPartner
    totalAmount
    updatedAt
    orderId
    order {
      _id
      orderNo
      orderPrice
      billingAddressId
      shippingAddressId
      paymentStatus
      currency
      fulfillmentStatus
      pickup_scheduled_date
      shippingAmount
      taxAmount
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      cart {
        asset {
          altText
          _id
          isFeatured
          path
          type
        }
        description
        finalPrice
        qty
        price
        name
        variantDetail {
          selectedOptions
          sku
          status
          stockStatus
          variantDetailId
          variantPrice
          priceDifference
          stockQuantity
        }
        productId
        product {
          _id
          name
          slug
          productOptions {
            optionName
            choices {
              name
            }
            showInProductPageAs
          }
        }
      }
      billingAddress {
        firstname
        lastname
        email
        addressline1
        addressline2
        addressType
        city
        country
        countryCode
        phone
        pincode
        states
        primary
        landmark
        flat
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
        city
        countryCode
        country
        states
        pincode
        primary
      }
      awb_code
      trackInfo {
        date
        status
        activity
        location
        sr_status
        sr_status_label
      }
      courierName
      createdAt
      updatedAt
      shipmentStatus
    }
  }
}
`;