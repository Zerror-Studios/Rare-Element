"use client";

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

export const SocialCardData = [
  {
    id: 1,
    img: "/images/homepage/footer_reels/rings.webp",
    vid: "/videos/footer_reels/Ring.webm",
    title: "Ring",
    description: "Delicate Yet Dazzling",
  },
  {
    id: 2,
    img: "/images/homepage/footer_reels/earring.webp",
    vid: "/videos/footer_reels/Earring.webm",
    title: "Earring",
    description: "Quiet Yet Brilliant",
  },
  {
    id: 3,
    img: "/images/homepage/category/Necklace.webp",
    vid: "/videos/footer_reels/Necklace.webm",
    title: "Necklace",
    description: "Refined Everyday Sparkle",
  },
  {
    id: 4,
    img: "/images/homepage/footer_reels/bracelet.webp",
    vid: "/videos/footer_reels/Bracelet.webm",
    title: "Bracelet",
    description: "A Study In Sparkle",
  },
]

const SocialReels = () => {
  const [imgReady, setImgReady] = useState({});
  return (
    <>
      <div className="social_header">
        <p className="social_subtitle text-base thin uppercase">Follow us on</p>
        <h2 className="social_title text-3xl">Instagram</h2>
        <Link alt="Instagram" href={"https://www.instagram.com/nahara.jewellery/?igsh=MXgwcmQ2ODhnaTR3ag%3D%3D#"} target="_blank" className='text-base  underline '>@nahara.jewellery</Link>
      </div>
      <div className="socialCard_section scroller_none padding">
        {SocialCardData?.map((item, i) => {
          const imgLoaded = imgReady[i];
          return (
            <div key={i} className="socialCard_box">
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
              <video className='cover socialCard_box_vid ' loop autoPlay muted playsInline src={item.vid}></video>
              <div className="socialCard_image_wrapper">
                <Image
                  width={250}
                  height={400}
                  className="socialCard_image"
                  src={item.img}
                  alt={`${item.title} - Social Media Post`}
                  onLoadingComplete={() => setImgReady((prev) => ({ ...prev, [i]: true }))}
                // sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 400px"
                />
              </div>

              <h2 className="socialCard_title text-xl  uppercase">
                {/* <span className=" text-4xl thin">{item.titleSpan}</span>{" "} */}
                {item.description}
              </h2>
              {/* <p className="socialCard_description thin text-xl">
              {item.description}
            </p> */}
            </div>
          )
        }
        )}
      </div>

    </>
  )
}

export default SocialReels