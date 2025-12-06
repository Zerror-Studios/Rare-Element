import { gql } from "@apollo/client";

export const CART_LIST = gql`
  query GetCart($guestId: String, $cartId: String, $token: String) {
    getCart(guestId: $guestId, cartId: $cartId, token: $token) {
      _id
      userId
      guestId
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      isFreeShippingEnabled
      cart {
        name
        description
        asset {
          _id
          path
          type
          isFeatured
          altText
          createdAt
          updatedAt
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
      nimbblOrderId
      nimbblInvoiceId
      nimbblTransanctionId
      createdAt
      updatedAt
    }
  }
`;
