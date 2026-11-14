// PRD-015 FR-20: shopper cancel and returns. The server re-checks every
// rule (own order, store policy, window, quantities); the page only shows
// what `canCancel` / `returnableItems` allow.

export { CancelMyOrderDocument as CANCEL_MY_ORDER } from "@zcom/storefront-kit/graphql";

export { CreateReturnRequestDocument as CREATE_RETURN_REQUEST } from "@zcom/storefront-kit/graphql";

export { CancelMyReturnRequestDocument as CANCEL_MY_RETURN_REQUEST } from "@zcom/storefront-kit/graphql";
