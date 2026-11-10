"use client";

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import SeoHeader from '@/components/seo/SeoHeader'
import ProductCard from '@/components/common/ProductCard'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG, GET_PRODUCTS } from '@/graphql'
import { getProductPriceLabel } from '@/utils/Util'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import { useApolloClient, useQuery } from '@apollo/client/react'
import useCategoryStore from '@/store/category-store'
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn'
import ListingSortSelect from '@/components/product/ListingSortSelect'
import { useListingSort } from '@/hooks/useListingSort'
import { ProductStatus } from '@/utils/Constant'
import { DEFAULT_LISTING_SORT, toSortQueryValue } from '@/utils/listing-sort'

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

  // W2V2-05: each first-page load (sort change, new category) takes a new
  // number; a response that comes back after a newer request is dropped, so
  // a slow older list never renders under the newer sort label.
  const listRequestRef = useRef(0);

  // SEO (kit live check): the store is filled after mount (and again per
  // category), so until it holds this path's first page the server's page
  // renders from the props; the server HTML then links every listed product.
  const [storePath, setStorePath] = useState(null);

  useEffect(() => {
    listRequestRef.current += 1;
    setImageReady(false);
    resetStore();
    setInitialProducts(initialProducts, initialTotalCount);
    setStorePath(pathname);
  }, [pathname, initialProducts, initialTotalCount]);

  const isStoreReady = storePath === pathname;
  const listedProducts = isStoreReady ? products : initialProducts || [];
  const listHasMore = isStoreReady
    ? hasMore
    : listedProducts.length < (initialTotalCount || 0);

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

  // W2-STORE: the category's own product list has no sort, so another
  // order reads the same products (`categoryIds`) from getClientSideProducts.
  const client = useApolloClient();
  const fetchSortedPage = async (nextSort, pageOffset) => {
    const { data: result } = await client.query({
      query: GET_PRODUCTS,
      variables: {
        offset: pageOffset,
        limit,
        filters: { status: ProductStatus.PUBLISHED, categoryIds: [data?._id] },
        sort: toSortQueryValue(nextSort),
      },
      fetchPolicy: 'network-only',
    });
    return result?.getClientSideProducts;
  };

  const loadFirstPage = async (nextSort) => {
    listRequestRef.current += 1;
    const requestId = listRequestRef.current;
    const isCurrent = () => requestId === listRequestRef.current;
    setLoading(true);
    try {
      if (nextSort === DEFAULT_LISTING_SORT) {
        setInitialProducts(initialProducts, initialTotalCount);
        return;
      }
      const page = await fetchSortedPage(nextSort, 0);
      if (page && isCurrent()) {
        setInitialProducts(page.products || [], page.totalCount || 0);
      }
    } catch (error) {
      console.error("Error sorting products:", error);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const { sort, changeSort } = useListingSort(loadFirstPage);
  const handleSortChange = (value) => loadFirstPage(changeSort(value));

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    // A page for a list that has since been replaced is dropped (W2V2-05).
    const requestId = listRequestRef.current;
    const isCurrent = () => requestId === listRequestRef.current;
    setLoading(true);

    try {
      if (sort !== DEFAULT_LISTING_SORT) {
        const page = await fetchSortedPage(sort, offset);
        if (page && isCurrent()) {
          appendProducts(page.products || [], page.totalCount || 0);
        }
        return;
      }
      const { data: result } = await fetchMore({
        variables: {
          slug: data?.slug || data?.categoriesSlug,
          limit: limit,
          offset: offset,
        }
      });

      if (result?.getClientSideCategory?.products && isCurrent()) {
        appendProducts(result.getClientSideCategory.products, result.getClientSideCategory.productsCount);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const heroImg = containerRef.current.querySelector(".products_hero-img");
      if (!heroImg) return;

      gsap.set(heroImg, { opacity: 0 });

      gsap.to(heroImg, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <>
      <SeoHeader meta={meta} breadcrumbList={breadcrumbList} />
      <div ref={containerRef}>

        <div className="products_hero-section skeleton_animate">
          <Image
            sizes="100vw"
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

        <div className="category_products_header ">
          <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
          <h1 className="products_title text-3xl">{data?.name || ""}</h1>
        </div>

        <div className="listing_sort_bar">
          <ListingSortSelect
            id="category_sort"
            value={sort}
            onChange={handleSortChange}
            disabled={loading}
          />
        </div>

        <div className="padding">
          <div className={`allproducts_paren  categories_paren ${loading ? "opacity-50" : ""}`}>
            {listedProducts.length > 0 ? (
              listedProducts.map((item) => (
                <Link
                  key={item._id}
                  scroll={false}
                  href={`/products/${item.slug || item._id}`}
                >
                  <ProductCard
                    productId={item._id}
                    name={item.name || ""}
                    price={getProductPriceLabel(item.variants)}
                    assets={item.assets || []}
                    product={item}
                    listName={data?.name || "Category"}
                  />
                </Link>
              ))
            ) : (
              <h2 className='text-xl text-center'>No products found</h2>
            )
            }
          </div>

          {listHasMore && (
            <div className="load_more_container">
              <GreenBoxBtn title="Load More" onClick={handleLoadMore} loading={loading} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
