"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Category = ({ data }) => {

    const [imgReady, setImgReady] = useState({});

    useGSAP(() => {
        gsap.to(([".category_header", ".home_category_paren"]), {
            opacity: 1,
            delay: 0.1, // Reduced to match faster LCP hero
            stagger: 0.2
        })
    })

    return (
        <div className="padding category_paren">
            <div className="category_header">
                <p className='text-base uppercase thin'>Shop by Category</p>
            </div>
            <div className="home_category_paren scroller_none">
                <div className="home_category_inner scroller_none">
                    {data?.map((item, index) => {
                        const imgLoaded = imgReady[index];

                        return (
                            <Link prefetch scroll={false} key={index} href={`${item?.link}`}>
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        {!imgLoaded && (
                                            <div
                                                className="skeleton_box skeleton_animate"
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    zIndex: 5
                                                }}
                                            />
                                        )}
                                        <Image
                                            width={150}
                                            height={150}
                                            src={item?.image}
                                            className="category_box_img"
                                            alt={item?.title || "Jewellery Category"}
                                            style={{
                                                opacity: imgLoaded ? 1 : 0,
                                                transition: "opacity .4s ease"
                                            }}
                                            onLoad={() =>
                                                setImgReady(prev => ({ ...prev, [index]: true }))
                                            }
                                        />
                                    </div>

                                    <p className="text-sm bold uppercase">
                                        {item?.title || ""}
                                    </p>

                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

export default Category