import { gql } from "@apollo/client";

// Category Queries
export const GET_CLIENT_SIDE_CATEGORIES = gql`
  query GetClientSideCategories(
    $offset: Int
    $limit: Int
    $filter: CategoriesFilterInput
  ) {
    getClientSideCategories(offset: $offset, limit: $limit, filter: $filter) {
      categories {
        _id
        name
        imgsrc
        slug
      }
      totalCount
    }
  }
`;

export const GET_CLIENT_SIDE_CATEGORY_BY_SLUG = gql`
  query GetClientSideCategory($slug: String, $limit: Int, $offset: Int) {
    getClientSideCategory(slug: $slug) {
      _id
      name
      description
      imgsrc
      slug
      meta {
        title
        description
        keywords
        primaryKeywords
        author
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
      products(limit: $limit, offset: $offset) {
       _id
        name
        description
        assets {
          path
          type
          altText
          isFeatured
          isHover
        }
        price
        discountedPrice
        slug
        status
        ribbon {
          name
          ribbonId
        }
        variants {
          variantPrice
          stockQuantity
          stockStatus
          status
        }
      }
      productsCount
    }
  }
`;
