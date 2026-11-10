import { GET_PRODUCTS, GET_CLIENT_SIDE_CATEGORIES, GET_FILTER_OPTIONS } from '@/graphql'
import { serverQuery } from '@/lib/server-query'
import ProductsClient from './products-client'
import { ProductStatus } from '@/utils/Constant'

export default async function ProductsData() {
  try {
    // Fetch Products
    const productsPromise = serverQuery(GET_PRODUCTS, {
      offset: 0,
      limit: 20,
      filters: {
        status: ProductStatus.PUBLISHED,
      },
    });

    // Fetch Categories
    const categoriesPromise = serverQuery(GET_CLIENT_SIDE_CATEGORIES, {
      limit: 100,
      filter: { isSpecialCategory: false }
    });

    // Fetch Filter Options
    const filterOptionsPromise = serverQuery(GET_FILTER_OPTIONS, { categoryIds: [] });

    const [productsResponse, categoriesResponse, filterOptionsResponse] = await Promise.all([
      productsPromise,
      categoriesPromise,
      filterOptionsPromise
    ]);

    return (
      <ProductsClient
        initialProducts={productsResponse?.getClientSideProducts?.products || []}
        initialTotalCount={productsResponse?.getClientSideProducts?.totalCount || 0}
        categories={categoriesResponse?.getClientSideCategories?.categories || []}
        initialFilterOptions={filterOptionsResponse?.getFilterOptions || { minPrice: 0, maxPrice: 0, attributes: [] }}
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
