"use client";

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import ProductCard from '@/components/common/ProductCard'
import { getProductPriceLabel } from '@/utils/Util'
import { GET_PRODUCTS } from '@/graphql'
import { ProductStatus } from '@/utils/Constant'
import ProductsAside from '@/components/product/ProductsAside'
import { RiEqualizerLine } from '@remixicon/react'
import { useQuery } from '@apollo/client/react'
import useProductStore from '@/store/product-store'
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'
import ListingSortSelect from '@/components/product/ListingSortSelect'
import { useListingSort } from '@/hooks/useListingSort'
import { toSortQueryValue } from '@/utils/listing-sort'

const ProductsClient = ({ initialProducts, initialTotalCount, categories, initialFilterOptions }) => {
  const [openFilter, setOpenFilter] = useState(false)
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

  // SEO (kit live check): the store is filled after mount, so until then
  // the server's first page renders from the props; the server HTML then
  // links every listed product, and the first client render matches it.
  const [isStoreReady, setIsStoreReady] = useState(false)

  useEffect(() => {
    setInitialProducts(initialProducts, initialTotalCount)
    setIsStoreReady(true)
  }, [])

  const listedProducts = isStoreReady ? products : initialProducts || []
  const listHasMore = isStoreReady
    ? hasMore
    : listedProducts.length < (initialTotalCount || 0)

  const { refetch, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: {
      offset: 0,
      limit: limit,
      filters: {
        status: ProductStatus.PUBLISHED,
      }
    },
    skip: true,
    fetchPolicy: "cache-first"
  });

  // W2V2-05: each first-page load takes a new number; a response that comes
  // back after a newer request is dropped, so a slow older list never
  // renders under the newer sort or filters.
  const listRequestRef = useRef(0)

  // W2-STORE: the first page again for new filters or a new sort (`?sort=`).
  const loadFirstPage = async (newFilters, nextSort) => {
    listRequestRef.current += 1
    const requestId = listRequestRef.current
    const isCurrent = () => requestId === listRequestRef.current
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
        },
        sort: toSortQueryValue(nextSort)
      })

      if (data?.getClientSideProducts && isCurrent()) {
        setInitialProducts(
          data.getClientSideProducts.products,
          data.getClientSideProducts.totalCount
        )
      }
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  };

  const { sort, changeSort } = useListingSort((fromUrl) =>
    loadFirstPage(useProductStore.getState().filters, fromUrl)
  )

  const handleApplyFilter = (newFilters) => loadFirstPage(newFilters, sort)

  const handleSortChange = (value) => loadFirstPage(filters, changeSort(value))

  const handleLoadMore = async () => {
    if (loading || !hasMore) return
    // A page for a list that has since been replaced is dropped (W2V2-05).
    const requestId = listRequestRef.current
    const isCurrent = () => requestId === listRequestRef.current
    setLoading(true)

    try {
      const { data } = await fetchMore({
        variables: {
          offset: offset,
          limit: limit,
          filters: {
            status: ProductStatus.PUBLISHED,
            ...filters
          },
          sort: toSortQueryValue(sort)
        }
      })

      if (data?.getClientSideProducts && isCurrent()) {
        appendProducts(
          data.getClientSideProducts.products,
          data.getClientSideProducts.totalCount
        )
      }
    } catch (error) {
      console.error("Error loading more products:", error)
    } finally {
      if (isCurrent()) setLoading(false)
    }
  }

  // useEffect(() => {
  //   gsap.to(".products_header ,.allproducts_paren", {
  //     opacity: 1,
  //     delay: 0.5,
  //     stagger: 0.1,
  //     duration: 1,
  //     ease: "power2.out"
  //   })
  // }, [])

  useEffect(() => {
    if (openFilter) {
      gsap.to(".products_aside_paren", {
        left: 0,
        duration: .8,
        ease: "power2.inOut",
      })
    } else {
      gsap.to(".products_aside_paren", {
        left: "-100%",
        duration: .8,
        ease: "power2.inOut",
      })
    }
  }, [openFilter])

  const handleClearFilter = () => {
    handleApplyFilter({})
  }

  return (
    <>
      <div className="products_header ">
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

      <div className="listing_sort_bar">
        <ListingSortSelect
          id="products_sort"
          value={sort}
          onChange={handleSortChange}
          disabled={loading}
        />
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
          <div className={`allproducts_paren  ${loading ? "opacity-50" : ""}`}>
            {listedProducts.length == 0 && !loading && (
              <div className="empty_products_box">
                <h2 className='text-xl'>No products found</h2>
                <p onClick={handleClearFilter} className='text_decoration_underline'>Clear Filter</p>
              </div>
            )
            }

            {listedProducts.map((item) => (
              <Link prefetch key={item?._id} scroll={false} title={item?.name || ""} href={`/products/${item?.slug || item?._id}`} data-testid="product-card-link">
                <ProductCard
                  key={item?._id}
                  productId={item?._id}
                  name={item?.name || ""}
                  price={getProductPriceLabel(item?.variants)}
                  assets={item?.assets || []}
                  product={item}
                  listName="All products"
                />
              </Link>
            ))}
          </div>

          {listHasMore && (
            <div className="load_more_container">
              <GreenBoxBtn title="Load More" onClick={handleLoadMore} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProductsClient
