// Reviews come from the kit (kit PRD-003): shoppers only ever receive APPROVED
// reviews, and `user` is never selected (reviews carry `displayName`).

export { GetReviewsDocument as GET_PRODUCT_REVIEWS } from "@zcom/storefront-kit/graphql";

export { MyReviewsDocument as GET_MY_REVIEWS } from "@zcom/storefront-kit/graphql";

export { MyReviewableProductsDocument as GET_MY_REVIEWABLE_PRODUCTS } from "@zcom/storefront-kit/graphql";

export { ReviewLinkOrderDocument as GET_REVIEW_LINK_ORDER } from "@zcom/storefront-kit/graphql";

export { StorefrontReviewSettingsDocument as GET_STOREFRONT_REVIEW_SETTINGS } from "@zcom/storefront-kit/graphql";

export { GetProductReviewSummaryDocument as GET_PRODUCT_REVIEW_SUMMARY } from "@zcom/storefront-kit/graphql";
