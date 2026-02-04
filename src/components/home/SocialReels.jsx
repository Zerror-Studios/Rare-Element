import Image from 'next/image'
import Link from 'next/link'
import React from 'react'



export const SocialCardData = [
  {
    id: 1,
    img: "/images/homepage/footer_reels/rings.JPG",
    vid: "/videos/footer_reels/Ring.mp4",
    title: "Ring",
    description: "Delicate Yet Dazzling",
  },
  {
    id: 2,
    img: "/images/homepage/footer_reels/earring.JPG",
    vid: "/videos/footer_reels/Earring.mp4",
    title: "Earring",
    description: "Quiet Yet Brilliant",
  },
  {
    id: 3,
    img: "/images/homepage/category/Necklace.jpg",
    vid: "/videos/footer_reels/Necklace.mp4",
    title: "Necklace",
    description: "Refined Everyday Sparkle",
  },
  {
    id: 4,
    img: "/images/homepage/footer_reels/bracelet.JPG",
    vid: "/videos/footer_reels/Bracelet.mp4",
    title: "Bracelet",
    description: "A Study In Sparkle",
  },
]

const SocialReels = () => {
  return (
    <>
      <div className="social_header">
        <p className="social_subtitle text-base thin uppercase">Follow us on</p>
        <h2 className="social_title text-3xl">Instagram</h2>
        <Link alt="Instagram"  href={"https://www.instagram.com/nahara.jewellery/?igsh=MXgwcmQ2ODhnaTR3ag%3D%3D#"} target="_blank" className='text-base  underline '>@nahara.jewellery</Link>
      </div>
      <div className="socialCard_section scroller_none padding">
        {SocialCardData?.map((item, i) => (
          <div key={i} className="socialCard_box">
            <video className='cover socialCard_box_vid ' loop autoPlay muted playsInline src={item.vid}></video>
            <div className="socialCard_image_wrapper">
              <Image
                width={500}
                height={800}
                className="socialCard_image"
                src={item.img}
                alt="image"
            
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
        ))}
      </div>

    </>
  )
}

export default SocialReels