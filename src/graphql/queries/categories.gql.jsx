import { gql } from "@apollo/client";

export { GetCategoriesDocument as GET_CLIENT_SIDE_CATEGORIES } from "@zcom/storefront-kit/graphql";

export const GET_CLIENT_SIDE_CATEGORY_BY_SLUG = gql`
  query GetClientSideCategory($slug: String, $limit: Int, $offset: Int) {
    getClientSideCategory(slug: $slug) {
      _id
      name
      description
      imgsrc
      slug
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
      products(limit: $limit, offset: $offset) {
        _id
        name
        slug
        status
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
        availability
      }
      productsCount
    }
  }
`;
