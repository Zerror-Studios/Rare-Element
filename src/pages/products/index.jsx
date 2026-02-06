import React, { useEffect, useState, startTransition } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { createApolloClient } from '@/lib/apolloClient'
import { getProductPriceLabel } from '@/utils/Util'
import { GET_PRODUCTS, GET_CLIENT_SIDE_CATEGORIES, GET_FILTER_OPTIONS } from '@/graphql'
import { ProductStatus } from '@/utils/Constant'
import Image from 'next/image'
import ProductsFilterHeader from '@/components/product/ProductsFilterHeader'
import ProductsAside from '@/components/product/ProductsAside'
import { RiEqualizerLine, RiFilterLine } from '@remixicon/react'
import { useQuery } from "@apollo/client/react";

const AllProducts = ({ meta, products: initialProducts, categories, filterOptions }) => {
  const [openFilter, setOpenFilter] = useState(false)
  const [filters, setFilters] = useState({})
  const [isHydrated, setIsHydrated] = useState(false)

  // Ensure hydration is complete before running queries
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: {
      offset: 0,
      limit: 10,
      filters: {
        status: ProductStatus.PUBLISHED,
        ...filters
      }
    },
    skip: !isHydrated || Object.keys(filters).length === 0 // Wait for hydration and filters
  });

  const products = (Object.keys(filters).length === 0) ? initialProducts : (data?.getClientSideProducts?.products || []);

  const handleApplyFilter = (newFilters) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  };

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


  return (
    <>
      <SeoHeader meta={meta} />
      <div className="products_header">
        <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
        <h1 className="products_title text-3xl">Explore  Products</h1>
      </div>

      <div className="w-full center">
        <button type="button" onClick={() => setOpenFilter(true)} className="open_filter  text-xs uppercase">
          <RiEqualizerLine size={14} />
          <p className="uppercase text-base">
            Apply Filter
          </p>
        </button>
      </div>

      <div className=" products_layout_paren padding ">
        <ProductsAside
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          categories={categories}
          filterOptions={filterOptions}
          onApply={handleApplyFilter}
        />
        <div className={`allproducts_paren ${loading ? "opacity-50" : ""}`}>
          {products?.length == 0 && !loading && <h2 className='text-xl text-center'>No products found</h2>}

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
        limit: 100,
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

    // Fetch Filter Options
    const filterOptionsPromise = client.query({
      query: GET_FILTER_OPTIONS,
      variables: {
        categoryIds: [] // Empty for all products, can be filtered later
      }
    });

    const [productsResponse, categoriesResponse, filterOptionsResponse] = await Promise.all([productsPromise, categoriesPromise, filterOptionsPromise]);

    return {
      props: {
        meta,
        products: productsResponse?.data?.getClientSideProducts?.products || [],
        categories: categoriesResponse?.data?.getClientSideCategories?.categories || [],
        filterOptions: filterOptionsResponse?.data?.getFilterOptions || { minPrice: 0, maxPrice: 0, attributes: [] },
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