import { gql } from "@apollo/client";

// Prices come from variants (`price`, strike-through `compareAtPrice`).
// Nested variants are PUBLISHED only; storefronts get no stock or badge
// names (both are admin-only), so neither is selected.
export const GET_PRODUCTS = gql`
  query GetClientSideProducts($limit: Int, $offset: Int, $filters: GetProductsFilterInput) {
    getClientSideProducts(limit: $limit, offset: $offset, filters: $filters) {
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
      }
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
