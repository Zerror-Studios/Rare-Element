"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";

const ProductImageGrid = ({ filter, data, title }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
  const [thumbLoaded, setThumbLoaded] = useState({});
  const [slideLoaded, setSlideLoaded] = useState({});

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
      <div className="MobileImageSlider_container scroller_none">
        {/* Thumbnails */}
        <div data-lenis-prevent className="MobileImageSlider_thumbnails scroller_none">
          {filteredAssets.map((item, index) => {
            const src = item?.path || "/green_logo.svg";
            const video = isVideo(src);
            const loaded = thumbLoaded[index];

            return (
              <div
                key={index}
                onMouseEnter={() => handleThumbnailClick(index)}
                className={`MobileImageSlider_thumbnail ${selectedAssetIndex === index
                    ? "MobileImageSlider_thumbnail--active"
                    : "MobileImageSlider_thumbnail--inactive"
                  }`}
              >
                <div
                  className="thumbnail_video center"
                  style={{
                    position: "relative",
                    overflow: "hidden"
                  }}
                >

                  {/* Skeleton */}
                  {!loaded && (
                    <div
                      className="skeleton_box skeleton_animate"
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10
                      }}
                    />
                  )}

                  {video ? (
                    <>
                      <Image
                        width={50}
                        height={50}
                        src="/icons/play_btn.png"
                        alt="play"
                        className="play_btn_img"
                        style={{
                          position: "relative",
                          zIndex: 20
                        }}
                      />

                      <video
                        muted
                        playsInline
                        preload="metadata"
                        src={src}
                        className="cover"
                        style={{
                          opacity: loaded ? 1 : 0,
                          transition: "opacity .3s ease"
                        }}
                        onLoadedData={() =>
                          setThumbLoaded(prev => ({ ...prev, [index]: true }))
                        }
                      />
                    </>
                  ) : (
                    <Image
                      width={150}
                      height={200}
                      src={src}
                      alt={`${title} - Thumbnail`}
                      className="cover"
                      style={{
                        opacity: loaded ? 1 : 0,
                        transition: "opacity .3s ease"
                      }}
                      onLoad={() =>
                        setThumbLoaded(prev => ({ ...prev, [index]: true }))
                      }
                    />
                  )}
                </div>
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
              const loaded = slideLoaded[index];

              return (
                <SwiperSlide key={index} className="MobileImageSlider_slide">

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden"
                    }}
                  >

                    {/* Skeleton */}
                    {!loaded && (
                      <div
                        className="skeleton_box skeleton_animate"
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 10
                        }}
                      />
                    )}

                    {video ? (
                      <video
                        className="w-full"
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          opacity: loaded ? 1 : 0,
                          transition: "opacity .4s ease"
                        }}
                        onLoadedData={() =>
                          setSlideLoaded(prev => ({ ...prev, [index]: true }))
                        }
                      >
                        <source src={src} type="video/mp4" />
                      </video>
                    ) : (
                      <Image
                        fill
                        src={src}
                        alt={`${title} - Product Image ${index + 1}`}
                        className="MobileImageSlider_slideImage"
                        style={{
                          opacity: loaded ? 1 : 0,
                          transition: "opacity .4s ease"
                        }}
                        onLoad={() =>
                          setSlideLoaded(prev => ({ ...prev, [index]: true }))
                        }
                      />
                    )}

                  </div>

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
            <Image height={20} width={20} src="/icons/arrowLeft.svg"
              alt="img"

            />
          </button>
          <button
            className="MobileImageSlider_arrow right"
            onClick={() => swiperInstance?.slideNext()}
          >
            <Image height={20} width={20} src="/icons/arrowRight.svg"
              alt="img"

            />

          </button>
        </div>

      </div>
    </div>
  )
}

export default ProductImageGrid