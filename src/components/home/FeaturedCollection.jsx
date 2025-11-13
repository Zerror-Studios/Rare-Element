import React from 'react';
import ShopCard from '../common/ShopCard';
import { ProductsData } from '@/utils/ProductsData';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Link from 'next/link';

const FeaturedCollection = () => {
  return (
    <div className="featured_collections_section">
      <div className="featured_header text-center mb-6">
        <p className="featured_subtitle thin text-base uppercase text-gray-600">Crafted for Every Moment</p>
        <h2 className="featured_title text-3xl font-semibold">Featured Collections</h2>
      </div>

      <div className="featured_scroll relative">
        <Swiper
          slidesPerView={'auto'}
          spaceBetween={0}
          loop={true}
          infinite={true}
          speed={800}
          navigation={true}
          modules={[Navigation, Autoplay]}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          className="mySwiper"
        >
          {ProductsData?.map((item, i) => (
            <SwiperSlide key={i} className="featured_shopcard">
              <Link scroll={false} href={`/products/${item.slug}`}>
                <div className="featured_shopcard">
                  <ShopCard item={item} />
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
