import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";

const ProductImageGrid = ({ filter, data }) => {
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

  const filteredAssets = useMemo(() => {
    const idSet = new Set(filter);
    return data.filter(
      item => !item.isSizeGuide && (!filter.length || idSet.has(item._id))
    );
  }, [data, filter]);

  const isVideo = (src = "") => /\.(mp4|webm|ogg|mov)$/i.test(src);


  return (
    <div className="productDetail_left">
      <div className="MobileImageSlider_container">
        {/* Thumbnails */}
        <div data-lenis-prevent className="MobileImageSlider_thumbnails scroller_none">
          {filteredAssets.map((item, index) => {
            const src = item?.path || "/green_logo.svg";
            const video = isVideo(src);

            return (
              <div
                key={index}
                onMouseEnter={() => handleThumbnailClick(index)}
                className={`MobileImageSlider_thumbnail ${selectedAssetIndex === index
                  ? "MobileImageSlider_thumbnail--active"
                  : "MobileImageSlider_thumbnail--inactive"
                  }`}
              >
                {video ? (
                  <div className="thumbnail_video center">
                    <img className="play_btn_img" src="/icons/play_btn.png" alt="" />
                    <video muted
                      playsInline src={src} className="cover" type="video/mp4" />
                  </div>
                ) : (
                  <Image
                    width={150}
                    height={200}
                    src={src}
                    alt={item?.altText || ""}
                  />
                )}
              </div>
            );
          })}
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
            {filteredAssets.map((item, index) => {
              const src = item?.path || "/green_logo.svg";
              const video = isVideo(src);

              return (
                <SwiperSlide key={index} className="MobileImageSlider_slide">
                  {video ? (
                    <div className="MobileImageSlider_slideVideo">
                      <video
                        className="w-full"
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <source src={src} type="video/mp4" />
                      </video>
                    </div>

                  ) : (
                    <Image
                      fill
                      src={src}
                      alt={item?.altText || ""}
                      className="MobileImageSlider_slideImage"
                    />
                  )}
                </SwiperSlide>
              );
            })}

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