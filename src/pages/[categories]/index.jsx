import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import ScrollTrigger from 'gsap/dist/ScrollTrigger'

const Categories = ({ meta, data, productList }) => {
  const breadcrumbList = [
    { name: data?.name, slug: `/${data?.categoriesSlug || data?.slug}` }
  ];
  const pathname = usePathname()
  const containerRef = useRef(null)
  const [imageReady, setImageReady] = useState(false);

  // Replace useLayoutEffect with useEffect to avoid SSR mismatch warning
  useEffect(() => {
    if (!imageReady || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const height = window.innerWidth > 750 ? "76vh" : "40vh";
      const heroSection = containerRef.current.querySelector(".products_hero-section");
      const heroImg = containerRef.current.querySelector(".products_hero-img");

      if (!heroSection || !heroImg) return;

      // reset state
      gsap.set(
        [
          ".products_content",
          ".products_hero-img",
          ".products_header",
          ".allproducts_paren",
          ".category_products_header",
        ],
        { opacity: 0 }
      );

      gsap.fromTo(
        heroSection,
        { height: 0 },
        {
          height,
          duration: 1,
          ease: "ease-secondary",
        }
      );

      gsap.to(
        [
          ".products_content",
          ".products_hero-img",
          ".products_header",
          ".allproducts_paren",
          ".category_products_header",
        ],
        {
          opacity: 1,
          delay: 0.4,
          stagger: 0.1,
          duration: 1,
          ease: "ease-secondary",
        }
      );

      if (window.innerWidth >= 750) {
        gsap.to(heroImg, {
          y: 200,
          filter: "brightness(0.5)",
          ease: "linear",
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      ScrollTrigger.refresh(true);
    }, containerRef);

    return () => ctx.revert();
  }, [imageReady, pathname]);

  useEffect(() => {
    setImageReady(false);
  }, [pathname]);

  return (
    <>
      <SeoHeader meta={meta} breadcrumbList={breadcrumbList} />
      {/* <Suspense fallback={<CategoryPageSkeleton />}> */}
      <div ref={containerRef}>
        <div className="products_hero-section">
          <Image
            key={data?.imgsrc}
            fill
            priority
            className="products_hero-img"
            src={data?.imgsrc}
            alt={data?.name || ""}
            onLoad={() => setImageReady(true)}
          />

          {/* <div className="products_content padding">
          <h2 className='text-3xl '>{data?.name || ""}</h2>
          <p className='uppercase text-base thin'>
            {data?.description || ""}
          </p>
        </div> */}
        </div>

        <div className="category_products_header">
          <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
          <h1 className="products_title text-3xl">{data?.name || ""}</h1>
        </div>

        <div className="padding">
          <div className="allproducts_paren categories_paren ">
            {/* <Suspense fallback={<ProductCardSkeleton />}> */}
            {productList?.length > 0 ? (
              productList?.map((item) => (
                <Link
                  key={item._id}
                  scroll={false}
                  href={`/products/${item.slug || item._id}`}
                >
                  <ProductCard
                    productId={item._id}
                    name={item.name || ""}
                    ribbon={item.ribbon || ""}
                    price={getProductPriceLabel(
                      item.variants,
                      item.discountedPrice
                    )}
                    assets={item.assets || []}
                  />
                </Link>
              ))
            ) : (
              <h2 className='text-xl text-center'>No products found</h2>
            )
            }
            {/* </Suspense> */}

          </div>
        </div>
      </div>
      {/* </Suspense> */}
    </>
  )
}

export default Categories

export async function getStaticProps({ params }) {
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
        initialApolloState: client.cache.extract(),
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    const status = error.errors?.[0]?.extensions?.http?.status;
    if (status === StatusCode.NotFound) {
      return {
        notFound: true,
        revalidate: 60,
      }
    };
    return {
      props: {
        meta,
        data: {},
        productList: [],
      },
      revalidate: 60,
    };
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}