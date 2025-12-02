import React, { useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { createApolloClient } from '@/lib/apolloClient'
import { getProductPriceLabel } from '@/utils/Util'
import { StatusCode } from '@/utils/Constant'

const Categories = ({ meta, data, productList }) => {

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
        <img className='products_hero-img' src={"/images/productpage/heroImg.png"} alt={data?.name || ""} />
        <div className="products_content padding">
          <h2 className='text-3xl '>{data?.name || ""}</h2>
          <p className='text-xl thin'>
            {data?.description || ""}
          </p>
        </div>
      </div>
      <div className="products_header">
        <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
        <h2 className="products_title text-3xl">{data?.name || ""}</h2>
      </div>

      <div className="padding">
        <div className="allproducts_paren ">
          {productList?.map((item) => (
            <Link key={item?._id} scroll={false} href={`/products/${item?.slug || item?._id}`}>
              <ProductCard
                key={item?._id}
                name={item?.name || ""}
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