import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const ProductImageGrid = ({ data }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);

  useEffect(() => {
    if (swiperInstance && data?.length) {
      swiperInstance.update();
      swiperInstance.slideToLoop(0, 0);
      setSelectedAssetIndex(0);
    }
  }, [swiperInstance, data]);

  const handleThumbnailClick = (index) => {
    if (swiperInstance) {
      swiperInstance.slideToLoop(index);
    }
  };

  return (
    <div className="productDetail_left">
      <div className="MobileImageSlider_container">
        {/* Thumbnails */}
        <div className="MobileImageSlider_thumbnails">
          {data?.map((item, index) => (
            <div
              key={index}
              onMouseEnter={() => handleThumbnailClick(index)}
              className={`MobileImageSlider_thumbnail ${selectedAssetIndex === index
                ? "MobileImageSlider_thumbnail--active"
                : "MobileImageSlider_thumbnail--inactive"
                }`}
            >
              <img src={item?.path} alt={item?.altText || ""} />
            </div>
          ))}
        </div>

        {/* Swiper */}
        {data?.length > 0 && (
          <Swiper
            modules={[Navigation, A11y, Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            speed={800}
            navigation={true}
            loop
            className="MobileImageSlider_swiper"
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setSelectedAssetIndex(swiper.realIndex)}
          >
            {data?.map((item, index) => (
              <SwiperSlide key={index} className="MobileImageSlider_slide">
                <img
                  src={item?.path}
                  alt={item?.altText || ""}
                  className="MobileImageSlider_slideImage"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        <div className="MobileImageSlider_nav">
          <button
            className="MobileImageSlider_arrow left"
            onClick={() => swiperInstance?.slidePrev()}
          >
            <img src="/icons/arrowLeft.svg" alt="loading" />
          </button>
          <button
            className="MobileImageSlider_arrow right"
            onClick={() => swiperInstance?.slideNext()}
          >
            <img src="/icons/arrowRight.svg" alt="loading" />

          </button>
        </div>

      </div>
    </div>
  )
}

export default ProductImageGrid