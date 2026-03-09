import { GET_PRODUCT_BY_ID, GET_PRODUCTS } from "@/graphql";
import { getClient } from "@/lib/apollo-client-rsc";
import { ProductStatus } from '@/utils/Constant';
import ProductClient from "./product-client";
import { notFound } from "next/navigation";

export const revalidate = 300;

const defaultMeta = {
  title: "Shop All Jewellery – Nahara Fine Jewellery Collection",
  description: "Explore Nahara’s full jewellery collection including rings, earrings, necklaces, bracelets, and anklets crafted in gold, diamonds, and silver.",
  keywords: [
    "jewellery online",
    "Nahara products",
    "rings earrings bracelets",
    "gold and diamond jewellery"
  ],
  robots: "index, follow",
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_PRODUCT_BY_ID,
      variables: { slug },
    });

    const meta = data?.getClientSideProductById?.meta;
    const name = data?.getClientSideProductById?.name;
    const description = data?.getClientSideProductById?.description;

    return {
      title: meta?.title || `${name} | Nahara Jewellery` || defaultMeta.title,
      description: meta?.description || description || defaultMeta.description,
      keywords: meta?.keywords || defaultMeta.keywords,
      robots: meta?.robots || defaultMeta.robots,
    };
  } catch (error) {
    return defaultMeta;
  }
}

export default async function Page({ params }) {
  const { slug } = await params;

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
    const productList = productListRes?.data?.getClientSideProducts?.products || [];

    return (
      <ProductClient
        meta={data?.meta || defaultMeta}
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

