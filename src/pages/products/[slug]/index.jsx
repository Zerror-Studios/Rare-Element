import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import React, { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import ShopCard from '@/components/common/ShopCard';
import { ProductsData } from '@/utils/ProductsData';
import Link from 'next/link';
gsap.registerPlugin(ScrollTrigger);

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useRouter } from 'next/router';
import { usePathname } from 'next/navigation';

const ProductDetail = () => {
    const pathname = usePathname()
    const router = useRouter();
    const { slug } = router?.query;

    const product = ProductsData.find((item) => item.slug === slug);

    const [openIndex, setOpenIndex] = useState(null);

    const [openDropdown, setOpenDropdown] = useState(null); // "color" | "size" | null

    const toggleDropdown = (type) => {
        setOpenDropdown((prev) => (prev === type ? null : type));
    };

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const [swiperInstance, setSwiperInstance] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        if (swiperInstance && product?.images?.length) {
            swiperInstance.update();
            swiperInstance.slideToLoop(0, 0);
            setActiveIndex(0);
        }
    }, [swiperInstance, product]);

    const handleThumbnailClick = (index) => {
        if (swiperInstance) {
            swiperInstance.slideToLoop(index);
        }
    };


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
    }, [pathname])


    return (
        <>
            <div className="productDetail_main padding">

                <div className="productDetail_left">

                    <div className="MobileImageSlider_container">
                        {/* Thumbnails */}
                        <div className="MobileImageSlider_thumbnails">
                            {product?.images.map((image, index) => (
                                <div
                                    key={index}
                                    onMouseEnter={() => handleThumbnailClick(index)}
                                    className={`MobileImageSlider_thumbnail ${activeIndex === index
                                        ? "MobileImageSlider_thumbnail--active"
                                        : "MobileImageSlider_thumbnail--inactive"
                                        }`}
                                >
                                    <img src={image} alt={`Product Image ${index + 1}`} />
                                </div>
                            ))}
                        </div>

                        {/* Swiper */}
                        {product?.images?.length > 0 && (
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
                                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                            >
                                {product?.images.map((image, index) => (
                                    <SwiperSlide key={index} className="MobileImageSlider_slide">
                                        <img
                                            src={image}
                                            alt={`Product Image ${index + 1}`}
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
                                <img src="/icons/arrowLeft.svg" alt="" />
                            </button>
                            <button
                                className="MobileImageSlider_arrow right"
                                onClick={() => swiperInstance?.slideNext()}
                            >
                                <img src="/icons/arrowRight.svg" alt="" />

                            </button>
                        </div>

                    </div>

                </div>




                <div className="productDetail_right">
                    <div className="productDetail_sticky">
                        <div className="productDetail_info">
                            <div className="productDetail_info_left">
                                <Link scroll={false} href="/products">
                                    <p className="productDetail_category text-lg  ">RINGS</p>
                                </Link>
                                <h2 className="productDetail_title text-xl ">{product?.title}</h2>
                                <p className="productDetail_price text-xl ">₹  {product?.price}</p>
                            </div>
                        </div>
                        <div className="productDetail_options">
                            <div className="productDetail_row">
                                <div
                                    className={`productDetail_select ${openDropdown === "color" ? "active" : ""
                                        }`}
                                >
                                    <button className="text-base" onClick={() => toggleDropdown("color")}>
                                        <p className="productDetail_select_inner_elem">Silver</p>
                                        <img
                                            className={`productDetail_quantity_icon productDetail_select_inner_elem_img ${openDropdown === "color" ? "rotate_icon" : ""
                                                }`}
                                            src="/icons/LongArrowDown.svg"
                                            alt=""
                                        />
                                    </button>
                                </div>

                                <div
                                    className={`productDetail_select ${openDropdown === "size" ? "active" : ""
                                        }`}
                                >
                                    <button className="text-base" onClick={() => toggleDropdown("size")}>
                                        <p className="productDetail_select_inner_elem">Medium</p>
                                        <img
                                            className={`productDetail_quantity_icon productDetail_select_inner_elem_img ${openDropdown === "size" ? "rotate_icon" : ""
                                                }`}
                                            src="/icons/LongArrowDown.svg"
                                            alt=""
                                        />
                                    </button>
                                </div>

                            </div>

                            {/* Dropdowns */}
                            <div className="productDetail_selection_wrapper">
                                {/* Colors */}
                                <div
                                    className={`productDetail_selction ${openDropdown === "color" ? "open" : ""
                                        }`}
                                >
                                    <div className="color_selection">
                                        {Array.isArray(product?.colors) &&
                                            product.colors.map((item, index) => (
                                                <div key={index} className="select_color_paren">
                                                    <div className="color_div">
                                                        <div
                                                            style={{ backgroundColor: item.code }}
                                                            className="color_inner"
                                                        ></div>
                                                    </div>
                                                    <p className="text-base capitalize">{item.name}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div
                                    className={`productDetail_selction ${openDropdown === "size" ? "open" : ""
                                        }`}
                                >
                                    <a href="" className='text-xs underline size_link uppercase'>Size guide</a>
                                    <div className="color_selection">
                                        {Array.isArray(product?.sizes) &&
                                            product.sizes.map((item, index) => (
                                                <div key={index} className="select_color_paren">
                                                    <div className="color_div">
                                                        <div className="color_inner center">
                                                            <p className="text-base">{item}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>


                            <div className="productDetail_quantity text-xl">
                                <button className="productDetail_quantity_btn">
                                    <img className='productDetail_quantity_icon' src="/icons/minus.svg" alt="" />
                                </button>
                                <p>1</p>
                                <button className="productDetail_quantity_btn">
                                    <img className='productDetail_quantity_icon' src="/icons/plus.svg" alt="" />
                                </button>
                            </div>
                        </div>
                        <div className="productDetail_addtocart">
                            <div className="productDetail_btn ">
                                <p className='text-base uppercase'>Add To Cart</p>
                            </div>
                            <div className="productDetail_btn_icon center">
                                <div className="icon_pr">
                                    <img className='  short_links_icon_heart ' src="/icons/greenHeart.svg" alt="" />
                                    <img className=' short_links_icon_heart_hover' src="/icons/heartFill.svg" alt="" />
                                </div>
                            </div>
                        </div>
                        <div className="accordion_container">
                            {product?.accordionData.map((item, index) => (
                                <div className="accordion_item" key={index}>
                                    <button
                                        className="accordion_header"
                                        onClick={() => handleToggle(index)}
                                    >
                                        <p className="text-sm accordion_title uppercase bold">{item.title}</p>

                                        <img
                                            className={`productDetail_quantity_icon ${openIndex === index ? "rotated" : ""}`}
                                            src="/icons/LongArrowRight.svg"
                                            alt=""
                                        />
                                    </button>

                                    <div
                                        className={`accordion_content ${openIndex === index ? "open" : ""}`}
                                    >
                                        <p className="text-base">{item.content}</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>

            <div className="suggestion_parent padding">
                <div className="suggestion_parent_header">
                    <p className='text-base thin uppercase'>you may also like </p>
                </div>
                <div className="featured_scroll relative">
                        {ProductsData.slice(0, 4)?.map((item, i) => (
                            <div key={i} className="featured_shopcard">
                                <Link scroll={false} href={`/products/${item.slug}`}>
                                    <div className="featured_shopcard">
                                        <ShopCard item={item} />
                                    </div>
                                </Link>
                            </div>
                        ))}
                </div>
            </div>

            <div className="padding">
                <div className="image_banner_paren">
                    <div className="image_banner_paren_left">
                        <img className='cover' src="/images/productpage/giftsHeroimg.svg" alt="" />
                    </div>
                    <div className="image_banner_paren_right">
                        <div className="image_banner_paren_left_txt">
                            <h2 className='text-3xl uppercase'>Iconic gifts</h2>
                            <p className='text-xl thin'>From everyday classics to statement <br /> creations, our jewellery reflects beauty that <br /> endures beyond trends.</p>
                        </div>
                        <button>
                            <p className='text-lg bold'>Shop Now</p>
                        </button>
                    </div>
                </div>
            </div>

        </>
    )
}

export default ProductDetail