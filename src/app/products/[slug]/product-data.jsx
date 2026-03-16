import { GET_PRODUCT_BY_ID, GET_PRODUCTS } from "@/graphql";
import { getClient } from "@/lib/apollo-client-rsc";
import { ProductStatus } from "@/utils/Constant";
import ProductClient from "./product-client";
import { notFound } from "next/navigation";

export default async function ProductData({ slug }) {
  try {
    const client = getClient();

    const [productRes, productListRes] = await Promise.all([
      client.query({
        query: GET_PRODUCT_BY_ID,
        variables: { slug },
      }),
      client.query({
        query: GET_PRODUCTS,
        variables: {
          offset: 0,
          limit: 12,
          filters: {
            status: ProductStatus.PUBLISHED,
            slugNotInclude: slug,
          },
        },
      }),
    ]);

    if (!productRes?.data?.getClientSideProductById) {
      notFound();
    }

    const data = productRes?.data?.getClientSideProductById || {};
    const productList =
      productListRes?.data?.getClientSideProducts?.products || [];

    return (
      <ProductClient
        meta={data?.meta}
        data={data}
        productList={productList}
        slug={slug}
      />
    );
  } catch (error) {
    console.error("Error fetching product data:", error.message);
    notFound();
  }
}