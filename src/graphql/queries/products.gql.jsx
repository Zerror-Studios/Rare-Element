import { gql } from "@apollo/client";

export { GetProductsDocument as GET_PRODUCTS } from "@zcom/storefront-kit/graphql";

export { GetProductDocument as GET_PRODUCT_BY_ID } from "@zcom/storefront-kit/graphql";

export { GetFilterOptionsDocument as GET_FILTER_OPTIONS } from "@zcom/storefront-kit/graphql";

// PRD-014 FR-2.8 (UX-33): one page of product URLs for the sitemap.
export const GET_SITEMAP_PRODUCTS = gql`
  query GetSitemapProducts($limit: Int, $offset: Int, $filters: GetProductsFilterInput) {
    getClientSideProducts(limit: $limit, offset: $offset, filters: $filters) {
      products {
        _id
        slug
        updatedAt
      }
      totalCount
    }
  }
`;

export { GetProductsByIdsDocument as GET_PRODUCTS_BY_IDS } from "@zcom/storefront-kit/graphql";
