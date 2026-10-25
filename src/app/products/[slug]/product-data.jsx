import { cache } from "react";
import { GET_PRODUCT_BY_ID, GET_PRODUCT_REVIEWS, GET_PRODUCTS } from "@/graphql";
import { getClient } from "@/lib/apollo-client-rsc";
import { ProductStatus } from "@/utils/Constant";
import { isNotFoundError } from "@/utils/errors";
import ProductClient from "./product-client";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
// PRD-014 FR-2.8: the latest approved reviews shown on the page.
const PRODUCT_REVIEW_LIMIT = 10;

/**
 * The product for a URL segment: by slug, or by id for links that only
 * know the productId (cart, orders). null = it doesn't exist; any other
 * failure throws to the error boundary (SF-14). Cached per request so
 * `generateMetadata` and the page share one fetch.
 */
export const getProduct = cache(async (slug) => {
  const client = getClient();
  const lookups = [{ slug }];
  if (OBJECT_ID_PATTERN.test(slug)) lookups.push({ id: slug });

  for (const variables of lookups) {
    try {
      const { data } = await client.query({
        query: GET_PRODUCT_BY_ID,
        variables,
      });
      if (data?.getClientSideProductById) return data.getClientSideProductById;
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }
  return null;
});

export default async function ProductData({ slug }) {
  // page.jsx already handled "missing" and the slug redirect.
  const data = await getProduct(slug);

  // "You may also like" is optional: a failure leaves it empty.
  let productList = [];
  try {
    const client = getClient();
    const productListRes = await client.query({
      query: GET_PRODUCTS,
      variables: {
        offset: 0,
        limit: 12,
        filters: {
          status: ProductStatus.PUBLISHED,
          slugNotInclude: slug,
        },
      },
    });
    productList = productListRes?.data?.getClientSideProducts?.products || [];
  } catch (error) {
    console.error("Error fetching related products:", error.message);
  }

  // Reviews are optional as well: a failure hides the section.
  let reviews = { data: [], totalCount: 0 };
  try {
    const client = getClient();
    const reviewRes = await client.query({
      query: GET_PRODUCT_REVIEWS,
      variables: {
        offset: 0,
        limit: PRODUCT_REVIEW_LIMIT,
        filter: { productId: data?._id },
      },
    });
    reviews = reviewRes?.data?.getReviews || reviews;
  } catch (error) {
    console.error("Error fetching product reviews:", error.message);
  }

  return (
    <ProductClient
      meta={data?.seo}
      data={data}
      productList={productList}
      slug={slug}
      reviews={reviews.data || []}
      reviewCount={reviews.totalCount || 0}
    />
  );
}
