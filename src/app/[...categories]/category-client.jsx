"use client";

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { getProductPriceLabel } from '@/utils/Util'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import { useQuery } from '@apollo/client/react'
import useCategoryStore from '@/store/category-store'
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'

export default function CategoryClient({ meta, data, initialProducts, initialTotalCount }) {
  const {
    products,
    offset,
    limit,
    hasMore,
    loading,
    setInitialProducts,
    appendProducts,
    setLoading,
    resetStore
  } = useCategoryStore();

  const breadcrumbList = [
    { name: data?.name, slug: `/${data?.categoriesSlug || data?.slug}` }
  ];
  const pathname = usePathname()
  const containerRef = useRef(null)
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
    resetStore();
    setInitialProducts(initialProducts, initialTotalCount);
  }, [pathname, initialProducts, initialTotalCount]);

  const { fetchMore } = useQuery(
    GET_CLIENT_SIDE_CATEGORY_BY_SLUG,
    {
      variables: {
        slug: data?.slug || data?.categoriesSlug,
        limit: limit,
        offset: 0,
      },
      skip: true,
      fetchPolicy: 'cache-first',
    }
  );

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const { data: result } = await fetchMore({
        variables: {
          slug: data?.slug || data?.categoriesSlug,
          limit: limit,
          offset: offset,
        }
      });

      if (result?.getClientSideCategory?.products) {
        appendProducts(result.getClientSideCategory.products, result.getClientSideCategory.productsCount);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // if (!imageReady || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const heroSection = containerRef.current.querySelector(".products_hero-section");
      const heroImg = containerRef.current.querySelector(".products_hero-img");

      // if (!heroSection || !heroImg) return;

      // gsap.set(
      //   [
      //     ".products_content",
      //     ".products_hero-img",
      //     ".products_header",
      //     ".allproducts_paren",
      //     ".category_products_header",
      //   ],
      //   { opacity: 0 }
      // );

      gsap.to(
        heroSection,
        {
          opacity: 1,
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 0.8,
          ease: 'ease-secondary',
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

  return (
    <>
      <SeoHeader meta={meta} breadcrumbList={breadcrumbList} />
      <div ref={containerRef}>

        <div className="products_hero-section hidden">
          {!imageReady && (
            <div className="products_hero-section category_skeleton skeleton_animate"></div>
          )}
          <Image
            key={data?.imgsrc}
            fill
            priority
            fetchPriority="high"
            // sizes="100vw"
            quality={75}
            className="products_hero-img hidden "
            src={data?.imgsrc}
            alt={data?.name || ""}
            onLoad={() => setImageReady(true)}
          />
        </div>

        <div className="category_products_header hidden">
          <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
          <h1 className="products_title text-3xl">{data?.name || ""}</h1>
        </div>

        <div className="padding">
          <div className="allproducts_paren hidden categories_paren ">
            {products?.length > 0 ? (
              products?.map((item) => (
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
          </div>

          {hasMore && (
            <div className="load_more_container">
              <GreenBoxBtn title="Load More" onClick={handleLoadMore} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
