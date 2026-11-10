/**
 * Checkout URL copy (PRD-034 FR-1.9). Parsing and adding the link's items
 * are the kit's (`useCheckoutStart`, PRD-002 FR-4.1: at most 20 lines,
 * quantity 1–10, simple products resolved through `getVariantAvailability`);
 * this keeps Nahara's messages for its error keys.
 */

import { CHECKOUT_START_MAX_QTY } from "@zcom/storefront-kit/core";

/** Shopper copy for a kit error key (or the page's own `ADD_FAILED`). */
export function getCheckoutStartMessage(error) {
  switch (error) {
    case "CHECKOUT_LINK_TOO_MANY_LINES":
      return "This link has more items than we can add at once.";
    case "CHECKOUT_LINK_INVALID_QUANTITY":
      return `Each item can be added 1 to ${CHECKOUT_START_MAX_QTY} times.`;
    case "CHECKOUT_LINK_UNAVAILABLE":
      return "The items in this link aren't available any more.";
    case "ADD_FAILED":
      return "We couldn't add these items to your bag.";
    default:
      return "This link doesn't point to any items we can add.";
  }
}
