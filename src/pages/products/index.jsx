import React, { useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { createApolloClient } from '@/lib/apolloClient'
import { getProductPriceLabel } from '@/utils/Util'
import { GET_PRODUCTS } from '@/graphql'
import { ProductStatus } from '@/utils/Constant'
import Image from 'next/image'
import ProductsFilterHeader from '@/components/product/ProductsFilterHeader'

const AllProducts = ({ meta, products }) => {

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

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="products_hero-section ">
        <Image fill className='products_hero-img' src="/images/productpage/products_banner.avif" alt="loading" />
        <div className="products_content padding">
          <h2 className='text-3xl '>Timeless Elegance</h2>
          <p className='uppercase text-base thin'>
            Discover timeless jewellery crafted with precision, elegance, and the finest materials — designed to elevate every moment.
          </p>
        </div>
      </div>

      <ProductsFilterHeader title={"Explore  Products"} desc={"Crafted for Every Moment"} />

      <div className="padding">
        <div className="allproducts_paren ">
        {products?.length == 0 && <h2 className='text-xl text-center'>No products found</h2>}

          {products?.map((item) => (
            <Link key={item?._id} scroll={false} href={`/products/${item?.slug || item?._id}`}>
              <ProductCard
                key={item?._id}
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
    const response = await client.query({
      query: GET_PRODUCTS,
      variables: {
        offset: 0,
        limit: 10,
        filters: {
          status: ProductStatus.PUBLISHED,
        },
      },
    });
    return {
      props: {
        meta,
        products: response?.data?.getClientSideProducts?.products || [],
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return {
      props: {
        meta,
        products: [],
      },
    };
  }
}