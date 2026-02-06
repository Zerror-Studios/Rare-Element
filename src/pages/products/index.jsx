import React, { useEffect, useState, startTransition } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { createApolloClient } from '@/lib/apolloClient'
import { getProductPriceLabel } from '@/utils/Util'
import { GET_PRODUCTS, GET_CLIENT_SIDE_CATEGORIES, GET_FILTER_OPTIONS } from '@/graphql'
import { ProductStatus } from '@/utils/Constant'
import ProductsAside from '@/components/product/ProductsAside'
import { RiEqualizerLine } from '@remixicon/react'
import { useQuery } from '@apollo/client/react'
import useProductStore from '@/store/product-store'
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'

const AllProducts = ({ meta, products: initialProducts, totalCount: initialTotalCount, categories, filterOptions: initialFilterOptions }) => {
  const [openFilter, setOpenFilter] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions || { minPrice: 0, maxPrice: 0, attributes: [] })

  const {
    products,
    filters,
    offset,
    limit,
    hasMore,
    loading,
    setInitialProducts,
    appendProducts,
    setFilters,
    setLoading
  } = useProductStore()

  // Ensure hydration is complete
  useEffect(() => {
    setIsHydrated(true)
    setInitialProducts(initialProducts, initialTotalCount)
  }, [])

  const { data: filterData } = useQuery(GET_FILTER_OPTIONS, {
    variables: { categoryIds: [] },
    skip: !isHydrated,
    fetchPolicy: "cache-first"
  });

  useEffect(() => {
    if (filterData?.getFilterOptions) {
      setFilterOptions(filterData.getFilterOptions);
    }
  }, [filterData]);

  const { refetch, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      offset: 0,
      limit: limit,
      filters: {
        status: ProductStatus.PUBLISHED,
      }
    },
    skip: true, // We manually trigger refetch/fetchMore
    fetchPolicy: "cache-first"
  });

  const handleApplyFilter = async (newFilters) => {
    setLoading(true)
    setFilters(newFilters)
    setOpenFilter(false)

    try {
      const { data } = await refetch({
        offset: 0,
        limit: limit,
        filters: {
          status: ProductStatus.PUBLISHED,
          ...newFilters
        }
      })

      if (data?.getClientSideProducts) {
        setInitialProducts(
          data.getClientSideProducts.products,
          data.getClientSideProducts.totalCount
        )
      }
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      setLoading(false)
    }
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const { data } = await fetchMore({
        variables: {
          offset: offset,
          limit: limit,
          filters: {
            status: ProductStatus.PUBLISHED,
            ...filters
          }
        }
      })

      if (data?.getClientSideProducts) {
        appendProducts(
          data.getClientSideProducts.products,
          data.getClientSideProducts.totalCount
        )
      }
    } catch (error) {
      console.error("Error loading more products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    var height

    if (window.innerWidth > 750) {
      height = "76vh"
    } else {
      height = "47.5rem"
    }

    gsap.to(".products_hero-section", {
      height: height,
      duration: 1,
      ease: "ease-secondary"
    })

    gsap.set(".products_content, .products_hero-img, .products_header ,.allproducts_paren", {
      opacity: 0
    })
    gsap.to(".products_content, .products_hero-img, .products_header ,.allproducts_paren", {
      opacity: 1,
      delay: 0.5,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
  }, [])

  useEffect(() => {
    if (openFilter) {
      gsap.to(".products_aside_paren", {
        left: 0,
        duration: .8,
        ease: "in-out-quint",
      })
    } else {
      gsap.to(".products_aside_paren", {
        left: "-100%",
        duration: .8,
        ease: "in-out-quint",
      })
    }
  }, [openFilter])

  const handleClearFilter = () => {
    handleApplyFilter({})
  }

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="products_header">
        <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
        <h1 className="products_title text-3xl">Explore Products</h1>
      </div>

      <div className="w-full center">
        <button type="button" onClick={() => setOpenFilter(true)} className="open_filter text-xs uppercase">
          <RiEqualizerLine size={14} />
          <p className="uppercase text-base">
            Apply Filter
          </p>
        </button>
      </div>

      <div className="products_layout_paren padding">
        <ProductsAside
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          categories={categories}
          filterOptions={filterOptions}
          onApply={handleApplyFilter}
          handleClearFilter={handleClearFilter}
        />
        <div className="allproducts_paren_warp">
          <div className={`allproducts_paren ${loading ? "opacity-50" : ""}`}>
            {products?.length == 0 && !loading && (
              <div className="empty_products_box">
                <h2 className='text-xl'>No products found</h2>
                <p onClick={handleClearFilter} className='text_decoration_underline'>Clear Filter</p>
              </div>
            )
            }

            {products?.map((item) => (
              <Link prefetch key={item?._id} scroll={false} title={item?.name || ""} href={`/products/${item?.slug || item?._id}`}>
                <ProductCard
                  key={item?._id}
                  productId={item?._id}
                  name={item?.name || ""}
                  ribbon={item?.ribbon || ""}
                  price={getProductPriceLabel(item?.variants, item?.discountedPrice)}
                  assets={item?.assets || []}
                />
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="load_more_container">
              <GreenBoxBtn title="Load More" onClick={handleLoadMore} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}


export default AllProducts

export async function getServerSideProps() {

  const meta = {
    title: "Shop by Category – Fine Jewellery by Nahara",
    description: "Browse jewellery categories including rings, earrings, necklaces, bracelets, and anklets crafted with gold, diamonds, and silver.",
    keywords: [
      "jewellery categories",
      "rings earrings necklaces",
      "Nahara jewellery"
    ],
    primaryKeywords: ["jewellery categories"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Shop by Category – Fine Jewellery by Nahara",
      description: "Explore jewellery categories at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Shop by Category – Fine Jewellery by Nahara",
      description: "Shop jewellery categories at Nahara.",
    }
  };

  try {
    const client = createApolloClient();

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
        limit: 100, // Fetch enough categories
        filter: { isSpecialCategory: false } // Add any filter if needed, e.g. status
      }
    });

    const [productsResponse, categoriesResponse] = await Promise.all([productsPromise, categoriesPromise]);

    return {
      props: {
        meta,
        products: productsResponse?.data?.getClientSideProducts?.products || [],
        totalCount: productsResponse?.data?.getClientSideProducts?.totalCount || 0,
        categories: categoriesResponse?.data?.getClientSideCategories?.categories || [],
        filterOptions: { minPrice: 0, maxPrice: 0, attributes: [] },
        initialApolloState: client.cache.extract(),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return {
      props: {
        meta,
        products: [],
        categories: [],
        filterOptions: { minPrice: 0, maxPrice: 0, attributes: [] },
      },
    };
  }
}