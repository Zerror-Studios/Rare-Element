import { gql } from "@apollo/client";

// Prices come from variants (`price`, strike-through `compareAtPrice`).
// Nested variants are PUBLISHED only; badge names are admin-only. Stock is
// the coarse PRD-020 signal (`availability`, nullable: null = no signal).
export const GET_PRODUCTS = gql`
  query GetClientSideProducts(
    $limit: Int
    $offset: Int
    $filters: GetProductsFilterInput
    $sort: ClientProductSort
  ) {
    getClientSideProducts(
      limit: $limit
      offset: $offset
      filters: $filters
      sort: $sort
    ) {
      products {
        _id
        name
        slug
        assets {
          path
          type
          altText
          isFeatured
          isHover
        }
        variants {
          _id
          price
          compareAtPrice
          status
        }
        categoryIds
        availability
      }
      totalCount
    }
  }
`;

// Look up by `slug` (pages) or by `id` (cart and order links carry only the
// productId; the page redirects them to the slug URL).
export const GET_PRODUCT_BY_ID = gql`
  query GetClientSideProductById($id: ID, $slug: String) {
    getClientSideProductById(id: $id, slug: $slug) {
      _id
      name
      description
      slug
      status
      categoryIds
      categories {
        _id
        name
        slug
      }
      additionalInfo {
        title
        description
      }
      productOptions {
        optionName
        choices {
          assetsId
          name
        }
        showInProductPageAs
      }
      assets {
        _id
        path
        type
        altText
        isSizeGuide
        isFeatured
        isHover
      }
      variants {
        _id
        title
        sku
        optionValues
        price
        compareAtPrice
        status
        availability
        availableQuantity
      }
      availability
      seo {
        title
        description
        keywords
        primaryKeywords
        author
        canonical
        robots
        og {
          title
          description
          image
        }
        twitter {
          card
          title
          description
          image
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions($categoryIds: [ID]) {
    getFilterOptions(categoryIds: $categoryIds) {
      minPrice
      maxPrice
      attributes {
        key
        values
      }
    }
  }
`;

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

// PRD-014 FE-22: the wishlist's products in one call (ids in the order
// asked; unpublished or missing products are left out; at most
// `MAX_PRODUCTS_BY_IDS` per call, so longer lists are chunked).
export const GET_PRODUCTS_BY_IDS = gql`
  query GetClientSideProductsByIds($ids: [ID!]) {
    getClientSideProductsByIds(ids: $ids) {
      _id
      name
      slug
      assets {
        path
        type
        altText
        isFeatured
        isHover
      }
      variants {
        _id
        price
        compareAtPrice
        status
      }
      categoryIds
      availability
    }
  }
`;

// PRD-020 FR-8: the fresh read for the PDP (mount, variant change) and the
// cart (open). Never cached server-side; at most 50 ids; unknown and
// unpublished ids are left out. A failure keeps the rendered value.
export const GET_VARIANT_AVAILABILITY = gql`
  query GetVariantAvailability($variantIds: [ID!]!) {
    getVariantAvailability(variantIds: $variantIds) {
      productId
      variantId
      availability
      availableQuantity
    }
  }
`;
