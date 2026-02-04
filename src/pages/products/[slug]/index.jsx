import React, { useEffect, useMemo, useState } from "react";
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { toast } from 'react-toastify';
import { useRouter } from "next/router";
import { useVisitor } from "@/hooks/useVisitor";
import { createApolloClient } from '@/lib/apolloClient';
import { useMutation } from '@apollo/client/react';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { Const, ProductStatus } from '@/utils/Constant';
import { ADD_ITEM_TO_CART, CREATE_BACK_IN_STOCK_REQUEST, GET_PRODUCT_BY_ID, GET_PRODUCTS } from "@/graphql";
import SeoHeader from "@/components/seo/SeoHeader";
import ProductImageGrid from '@/components/product/ProductImageGrid';
import ProductContant from '@/components/product/ProductContant';
import ProductListGrid from "@/components/product/ProductListGrid";
import ProductBanner from "@/components/product/ProductBanner";
import { TokenManager } from "@/utils/tokenManager";
gsap.registerPlugin(ScrollTrigger);

const ProductDetail = ({ meta, data, productList }) => {
  const breadcrumbList = [
    { name: data?.categories?.[0]?.name || "Products", slug: data?.categories?.[0]?.slug ? `/${data.categories[0].slug}` : "/products" },
    { name: data?.name, slug: `/products/${data?.slug}` }
  ];
  const router = useRouter();
  const { visitorId } = useVisitor();
  const basePrice = useMemo(
    () => (data?.discountedPrice > 0 ? data.discountedPrice : data?.price || 0),
    [data]
  );
  const [assetsFilter, setAssetsFilter] = useState([])
  const [finalPrice, setFinalPrice] = useState(basePrice);
  const [variantMatched, setVariantMatched] = useState(null);
  const [cartBtn, setCartBtn] = useState(false);
  const { user, isLoggedIn } = useAuthStore((state) => state);
  const { openCart } = useCartStore((state) => state);
  const token = TokenManager.getAccessToken();
  const [addItemToCart, { loading }] = useMutation(ADD_ITEM_TO_CART);
  const [createNotifyRequest, { loading: notifyLoading }] = useMutation(CREATE_BACK_IN_STOCK_REQUEST);

  useEffect(() => {
    gsap.set(".MobileImageSlider_thumbnails, .MobileImageSlider_swiper, .MobileImageSlider_nav, .productDetail_info ,.productDetail_options ,.productDetail_addtocart,.accordion_container", {
      opacity: 0
    })
    gsap.to(".MobileImageSlider_thumbnails, .MobileImageSlider_swiper, .MobileImageSlider_nav, .productDetail_info ,.productDetail_options ,.productDetail_addtocart,.accordion_container", {
      opacity: 1,
      delay: 0.5,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
  }, [router?.query?.slug])

  const handleAddToCart = async () => {
    if (!cartBtn || variantMatched.stockStatus === Const.OUT_OF_STOCK) return;

    try {
      const productId = data?._id;
      if (!productId) throw new Error("Product ID not found");

      if (!isLoggedIn && !visitorId) {
        toast.warn("Initializing session, please try again...");
        return;
      }

      const currentToken = TokenManager.getAccessToken();
      const payload = {
        input: {
          productId,
          categoryId: data?.categoryIds?.[0],
          variantDetail: variantMatched,
          ...(isLoggedIn && currentToken ? { token: currentToken } : {}),
        },
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
      };

      await addItemToCart({ variables: payload });
      openCart();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add item to cart");
    }
  };

  const handleNotifyMe = async () => {
    if (variantMatched.stockStatus !== Const.OUT_OF_STOCK) return;
    if (!isLoggedIn) return router.push("/login");
    try {
      const productId = data?._id;
      if (!productId) throw new Error("Product ID not found");

      const payload = {
        input: {
          productId,
          email: user?.email,
          userId: user?._id,
          variantId: variantMatched?.variantDetailId,
        },
      };

      await createNotifyRequest({ variables: payload });
      toast.success("You’ll be notified when this item is back in stock!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to notify");
    }
  };

  return (
    <>
      <SeoHeader meta={meta} productData={data} breadcrumbList={breadcrumbList} />
      <div className="productDetail_main padding">
        <ProductImageGrid filter={assetsFilter} data={data?.assets || []} title={data?.name} />
        <ProductContant
          data={data || {}}
          finalPrice={finalPrice}
          cartBtn={cartBtn}
          variantMatched={variantMatched} // Pass variantMatched
          loading={loading}
          notifyLoading={notifyLoading}
          isOutOfStock={variantMatched?.stockStatus === Const.OUT_OF_STOCK}
          setFinalPrice={setFinalPrice}
          setCartBtn={setCartBtn}
          setAssetsFilter={setAssetsFilter}
          setVariantMatched={setVariantMatched}
          handleAddToCart={handleAddToCart}
          handleNotifyMe={handleNotifyMe}
        />
      </div>
      <ProductListGrid title="You may also like" data={productList} />
      {/* <ProductBanner /> */}
    </>
  )
}

export default ProductDetail;

export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";
  const meta = {
    title: "Shop All Jewellery – Nahara Fine Jewellery Collection",
    description: "Explore Nahara’s full jewellery collection including rings, earrings, necklaces, bracelets, and anklets crafted in gold, diamonds, and silver.",
    keywords: [
      "jewellery online",
      "Nahara products",
      "rings earrings bracelets",
      "gold and diamond jewellery"
    ],
    primaryKeywords: ["jewellery online"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      "title": "Shop All Jewellery – Nahara Fine Jewellery Collection",
      "description": "Browse the complete Nahara jewellery collection.",
    },
    twitter: {
      "card": "summary_large_image",
      "title": "Shop All Jewellery – Nahara Fine Jewellery Collection",
      "description": "Explore Nahara’s jewellery collection.",
    }
  };

  try {
    const client = createApolloClient();
    const queries = [
      client.query({
        query: GET_PRODUCT_BY_ID,
        variables: { slug },
      }),
      client.query({
        query: GET_PRODUCTS,
        variables: {
          offset: 0,
          limit: 5,
          filters: {
            status: ProductStatus.PUBLISHED,
            slugNotInclude: slug,
          },
        },
      }),
    ].filter(Boolean);

    const [productRes, productListRes] = await Promise.all(queries);
    return {
      props: {
        meta: productRes?.data?.getClientSideProductById?.meta || meta,
        data: productRes?.data?.getClientSideProductById || {},
        productList:
          productListRes?.data?.getClientSideProducts?.products || [],
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return {
      props: {
        meta,
        data: {},
        productList: [],
      },
    };
  }
}