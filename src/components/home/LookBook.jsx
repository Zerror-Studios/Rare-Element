import React, { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Controller } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import { usePathname } from "next/navigation";
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from "@gsap/react";
import GreenBoxBtn from "../buttons/GreenBoxBtn";
gsap.registerPlugin(ScrollTrigger)

const LookBook = ({ data }) => {

    const leftSwiperRef = useRef(null);
    const rightSwiperRef = useRef(null);

    useEffect(() => {
        let tries = 0;
        const maxTries = 20;
        const interval = 75; // ms

        const tryInit = () => {
            tries++;
            const left = leftSwiperRef.current;
            const right = rightSwiperRef.current;

            if (left && right && left.autoplay && right.autoplay) {
                // ensure same timing settings (optional safety)
                left.params.speed = right.params.speed = 800;
                left.params.autoplay = right.params.autoplay = {
                    delay: 4000,
                    disableOnInteraction: false,
                };

                // Compute right's current realIndex (loop-aware) and set left to previous
                const currentIndex = typeof right.realIndex === "number"
                    ? right.realIndex
                    : right.activeIndex || 0; // fallback
                const prevIndex = (currentIndex - 1 + data.length) % data.length;

                // Jump left to prevIndex instantly
                left.slideToLoop(prevIndex, 0);

                // Start both autoplays at the same time
                // stop first to clear any internal timers (safe)
                right.autoplay.stop();
                left.autoplay.stop();

                // start both in immediate succession to minimize timing difference
                right.autoplay.start();
                left.autoplay.start();

                return; // done
            }

            if (tries < maxTries) {
                setTimeout(tryInit, interval);
            } else {
                // fallback — if initialization failed, try a final best-effort alignment
                if (leftSwiperRef.current && rightSwiperRef.current) {
                    const left = leftSwiperRef.current;
                    const right = rightSwiperRef.current;
                    const currentIndex = right.realIndex ?? right.activeIndex ?? 0;
                    const prevIndex = (currentIndex - 1 + data.length) % data.length;
                    left.slideToLoop(prevIndex, 0);
                    try { right.autoplay.start(); } catch (e) { }
                    try { left.autoplay.start(); } catch (e) { }
                }
            }
        };

        tryInit();
        // no cleanup required (we used timeouts that stop by themselves)
    }, [data.length]);



    const pathname = usePathname()

    // useGSAP(() => {
    //     gsap.fromTo(".lookbook_bg_img", {
    //         y: -100
    //     }, {
    //         scrollTrigger: {
    //             trigger: ".lookbook_section",
    //             start: "top bottom",
    //             end: "bottom top",
    //             scrub: true,
    //             // markers: true
    //         },
    //         y: 100,
    //         ease: "linear"
    //     })

    //     gsap.fromTo(".lookbookCard_image img", {
    //         y: -100
    //     }, {
    //         scrollTrigger: {
    //             trigger: ".lookbookCard_box",
    //             start: "top bottom",
    //             end: "bottom top",
    //             scrub: true,
    //             // markers: true
    //         },
    //         y: 100,
    //         ease: "linear"
    //     })

    // }, [pathname])

    return (
        <>
            {/* <div className="lookbook_section">
                <div className="lookbook_content">
                    <p className="lookbook_tagline uppercase text-base">The Essence of Elegance</p>
                    <h2 className="lookbook_title uppercase text-3xl">
                        Aurora Drop <br /> Earrings
                    </h2>
                    <button className="lookbook_button">
                        <p className="lookbook_btn_text text-base">Shop Now</p>
                    </button>
                </div>
                <img
                    className="lookbook_bg_img"
                    src="/images/homepage/bookletHero.svg"
                    alt="Aurora Drop Earrings"
                />
            </div> */}

            {/* <div className="lookbookCard_container">

                <div className="lookbookCard_box">
                    <div className="lookbookCard_image">
                        <img className='cover' src="/images/homepage/bookletbox1.svg" alt="loading" />
                    </div>
                    <div className="lookbookCard_text">
                        <h2 className="lookbookCard_title text-xl uppercase">Iconic Gifts</h2>
                        <p className="lookbookCard_link under_anim text-sm">Shop Now</p>
                    </div>
                </div>

                <div className="lookbookCard_box">
                    <div className="lookbookCard_image">
                        <img className='cover' src="/images/homepage/bookletbox2.svg" alt="loading" />
                    </div>
                    <div className="lookbookCard_text">
                        <h2 className="lookbookCard_title text-xl uppercase">Iconic Gifts</h2>
                        <p className="lookbookCard_link under_anim text-sm">Shop Now</p>
                    </div>
                </div>

            </div> */}

            <div className="lookBook_header">
                <h2 className="featured_title text-3xl font-semibold">The Looks</h2>
            </div>
            <div className="lookbookSlider_section">

                {/* LEFT SWIPER (previous slide) */}
                <div className="lookbookSlider_left">
                    <Swiper
                        modules={[Autoplay]}
                        onSwiper={(swiper) => (leftSwiperRef.current = swiper)}
                        centeredSlides={true}
                        spaceBetween={0}
                        loop={true}
                        speed={800}
                        autoplay={false}              // <-- disable auto-start
                        allowTouchMove={false}
                        className="lookbook_swiper_left"
                    >
                        {data.map((item) => (
                            <SwiperSlide key={item?._id}>
                                <div className="lookbookSlider_card_image_left">
                                    <img className="cover" src={item?.assets?.[1]?.path || ""} alt={item?.assets?.[1]?.altText || ""} />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* RIGHT SWIPER */}
                <div className="lookbookSlider_right">
                    {/* <div className="lookbookSlider_heading_wrapper">
                        <p className="lookbookSlider_heading uppercase text-base">The Looks</p>
                    </div> */}

                    <div className="lookbookSlider_card_wrapper">
                        <Swiper
                            modules={[Autoplay]}
                            onSwiper={(swiper) => (rightSwiperRef.current = swiper)}
                            slidesPerView={"auto"}
                            centeredSlides={true}
                            spaceBetween={150}
                            loop={true}
                            speed={800}
                            autoplay={false}             // <-- disable auto-start
                            allowTouchMove={false}
                            className="lookbook_swiper"
                        >
                            {data?.map((item) => (
                                <SwiperSlide key={item?._id} className="lookbookSlider_card">
                                    <div className="lookbookSlider_card">
                                        <div className="lookbookSlider_card_image">
                                            <img className="cover" src={item?.assets?.[1]?.path || ""} alt={item?.assets?.[1]?.altText || ""} />
                                        </div>
                                        <p className="lookbookSlider_card_description uppercase text-xl">
                                            {item?.name || ""}
                                        </p>
                                        <div className="center ">
                                            <div className="lookbook_button_paren">
                                                <GreenBoxBtn title={"shop Now"} href={`/products/${item?.slug || item?._id}`} />
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>


        </>
    )
}

export default LookBook