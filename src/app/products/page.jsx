import { GET_PRODUCTS, GET_CLIENT_SIDE_CATEGORIES, GET_FILTER_OPTIONS } from '@/graphql'
import { getClient } from '@/lib/apollo-client-rsc'
import ProductsClient from './products-client'
import { ProductStatus } from '@/utils/Constant'

export const revalidate = 300;

export const metadata = {
  title: "Shop by Category – Fine Jewellery by Nahara",
  description: "Browse jewellery categories including rings, earrings, necklaces, bracelets, and anklets crafted with gold, diamonds, and silver.",
  keywords: [
    "jewellery categories",
    "rings earrings necklaces",
    "Nahara jewellery"
  ],
};

export default async function Page() {
  try {
    const client = getClient();

    // Fetch Products
    const productsPromise = client.query({
      query: GET_PRODUCTS,
      variables: {
        offset: 0,
        limit: 20,
        filters: {
          status: ProductStatus.PUBLISHED,
        },
      },
    });

    // Fetch Categories
    const categoriesPromise = client.query({
      query: GET_CLIENT_SIDE_CATEGORIES,
      variables: {
        limit: 100,
        filter: { isSpecialCategory: false }
      }
    });

    // Fetch Filter Options
    const filterOptionsPromise = client.query({
      query: GET_FILTER_OPTIONS,
      variables: { categoryIds: [] }
    });

    const [productsResponse, categoriesResponse, filterOptionsResponse] = await Promise.all([
      productsPromise,
      categoriesPromise,
      filterOptionsPromise
    ]);

    return (
      <ProductsClient
        initialProducts={productsResponse?.data?.getClientSideProducts?.products || []}
        initialTotalCount={productsResponse?.data?.getClientSideProducts?.totalCount || 0}
        categories={categoriesResponse?.data?.getClientSideCategories?.categories || []}
        initialFilterOptions={filterOptionsResponse?.data?.getFilterOptions || { minPrice: 0, maxPrice: 0, attributes: [] }}
      />
    );
  } catch (error) {
    console.error("Error fetching products data:", error.message);
    return (
      <ProductsClient
        initialProducts={[]}
        initialTotalCount={0}
        categories={[]}
        initialFilterOptions={{ minPrice: 0, maxPrice: 0, attributes: [] }}
      />
    );
  }
}
