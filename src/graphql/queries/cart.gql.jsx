import { gql } from "@apollo/client";

// The owner comes from the access token (customer) or `guestId` (guest);
// every amount is computed by the server.
export const CART_LIST = gql`
  query GetCart($guestId: String, $cartId: String) {
    getCart(guestId: $guestId, cartId: $cartId) {
      _id
      userId
      guestId
      itemcount
      totalprice
      discountedPrice
      totalDiscount
      totalTax
      isFreeShippingEnabled
      pricesIncludeTax
      taxBreakdown {
        name
        rate
        amount
      }
      promotion {
        promotionId
        promotionName
        promotionCode
        discount
      }
      cart {
        productId
        variantId
        name
        sku
        asset {
          _id
          path
          type
          altText
          isFeatured
          isHover
        }
        price
        finalPrice
        qty
        freeQty
        customizations
      }
      createdAt
      updatedAt
    }
  }
`;
