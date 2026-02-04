import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query GetClientSideProducts($limit: Int, $offset: Int, $filters: GetProductsFilterInput) {
    getClientSideProducts(limit: $limit, offset: $offset, filters: $filters) {
      products {
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
        costOfGoods
        productType
        slug
        status
        isDeleted
          ribbon {
          name
          ribbonId
        }
        variants {
          selectedOptions
          priceDifference
          variantPrice
          sku
          variantCostOfGoods
          shippingWeight
          trackInventory
          stockQuantity
          status
          stockStatus
          visibility
        }
        productOptions {
          choices {
            assetsId
            name
          }
          optionName
          showInProductPageAs
        }
      }
      totalCount
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetClientSideProductById($slug: String) {
    getClientSideProductById(slug: $slug) {
      _id
      additionalInfo {
        description
        title
      }
      margin
      discountedPrice
      createdAt
      costOfGoods
      categoryIds
      categories {
        _id
        name
        slug
      }
      description
      name
      price
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
      saleType
      saleValue
      status
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
      variants {
        _id
        selectedOptions
        priceDifference
        variantPrice
        sku
        variantCostOfGoods
        shippingWeight
        trackInventory
        stockQuantity
        status
        stockStatus
        visibility
      }
      ribbon {
        name
        ribbonId
      }
      profit
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
