import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/common/ProductCard';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { getProductPriceLabel } from '@/utils/Util';

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const FeaturedCollection = ({ data }) => {
  return (
    <div className="featured_collections_section">
      <div className="featured_header text-center mb-6">
        <p className="featured_subtitle thin text-base uppercase text-gray-600">Crafted for Every Moment</p>
        <h2 className="featured_title text-3xl font-semibold">A New of Elegance</h2>
      </div>

      <div className="featured_scroll relative">
        <Swiper
          slidesPerView={'auto'}
          spaceBetween={0}
          centeredSlides={true}
          loop={true}
          speed={800}
          navigation={true}
          modules={[Navigation, Autoplay]}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          className="mySwiper"
        >
          {data?.map((item) => (
            <SwiperSlide key={item?._id} className="featured_shopcard">
              <Link prefetch scroll={false} href={`/products/${item?.slug || item?._id}`}>
                <div className="featured_shopcard">
                  <ProductCard
                    key={item?._id}
                    name={item?.name || ""}
                    ribbon={item?.ribbon || ""}
                    price={getProductPriceLabel(item?.variants, item?.discountedPrice)}
                    assets={item?.assets || []}
                  />
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FeaturedCollection;
