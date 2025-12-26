import React, { use, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { createApolloClient } from '@/lib/apolloClient'
import { getProductPriceLabel } from '@/utils/Util'
import { StatusCode } from '@/utils/Constant'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const Categories = ({ meta, data, productList }) => {
  const pathname = usePathname()
  const containerRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const height = window.innerWidth > 750 ? "76vh" : "47.5rem"

      gsap.set([
        ".products_content",
        ".products_hero-img",
        ".products_header",
        ".allproducts_paren",
        ".category_products_header"
      ], { opacity: 0 })

      gsap.fromTo(
        ".products_hero-section",
        { height: 0 },
        {
          height,
          duration: 1,
          delay:0.3,
          ease: "ease-secondary"
        }
      )

      gsap.to([
        ".products_content",
        ".products_hero-img",
        ".products_header",
        ".allproducts_paren",
        ".category_products_header"
      ], {
        opacity: 1,
        delay: 0.5,
        stagger: 0.1,
        duration: 1,
        ease: "ease-secondary"
      })

      if(window.innerWidth < 750) return
      gsap.to(".products_hero-img",{
        y:200,
        filter:"brightness(0.5)",
        ease:"linear",
        scrollTrigger:{
          trigger: ".products_hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      })

      
    }, containerRef)

    return () => ctx.revert() 
  }, [pathname])


  return (
    <>
      <SeoHeader meta={meta} />
      <div ref={containerRef}>
        <div className="products_hero-section ">
          <Image key={pathname} fill priority={true}
            className='products_hero-img'
            src={data?.imgsrc}
            alt={data?.name || ""} />
          {/* <div className="products_content padding">
          <h2 className='text-3xl '>{data?.name || ""}</h2>
          <p className='uppercase text-base thin'>
            {data?.description || ""}
          </p>
        </div> */}
        </div>

        <div className="category_products_header">
          <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
          <h2 className="products_title text-3xl">{data?.name || ""}</h2>
        </div>

        <div className="padding">
          <div className="allproducts_paren categories_paren ">
            {productList?.length == 0 && <h2 className='text-xl text-center'>No products found</h2>}

            {productList?.map((item) => (
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
      </div>
    </>
  )
}

export default Categories

export async function getServerSideProps({ params }) {
  const slug = params?.categories || "";
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
    const response = await client.query({ query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG, variables: { slug } });
    const { _id, name, description, imgsrc, slug: categoriesSlug, meta: categoriesMeta, products } = response?.data?.getClientSideCategory;
    return {
      props: {
        meta: categoriesMeta || meta,
        data: { _id, name, description, imgsrc, categoriesSlug } || {},
        productList: products || [],
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    const status = error.errors[0].extensions.http.status;
    if (status === StatusCode.NotFound) {
      return {
        notFound: true
      }
    };
    return {
      props: {
        meta,
        data: {},
        productList: [],
      },
    };
  }
}