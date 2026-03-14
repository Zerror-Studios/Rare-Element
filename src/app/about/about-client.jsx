"use client";

import React from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ScrollVelocityThree from '@/components/about/ScrollVelocity';
import Image from 'next/image';

export default function AboutClient() {

  useGSAP(() => {
    gsap.to(".abt_img_galry img, .abt_mob_txt img ", {
      opacity: 1, duration: 1.2, stagger: 0.1, delay: .5, ease: "expo.out"
    })

    gsap.fromTo(".sticker_bg_img", {
      y: -150
    }, {
      scrollTrigger: {
        trigger: ".about_sticker_section",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: 150,
      ease: "linear"
    })

    gsap.fromTo(".about_sticker_2", {
      bottom: "2rem",
    }, {
      bottom: "20rem",
      ease: "linear",
      scrollTrigger: {
        trigger: ".about_sticker_section",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    })
  })

  return (
    <>
      <div className="about_header">
        <div className="featured_header text-center mb-6">
          <p className="featured_subtitle thin text-base uppercase text-gray-600">A Note From Our Founder</p>
          <h1 className="featured_title text-3xl font-semibold">The Essence of Nahara</h1>
        </div>
      </div>

      <div className="abt_img_galry">
        <div className="about_marque_img_paren_1">
          <div className="marq_img_paren">
            <div className="marq_img_1">
              <Image className='cover' src="/images/aboutpage/img1.avif" alt="img" width={400} height={600} />
            </div>
            <div className="marq_img_2">
              <Image className='cover' src="/images/aboutpage/img2.avif" alt="img" width={400} height={600} />
            </div>
          </div>
          <div className="marq_img_3">
            <Image className='cover' src="/images/aboutpage/img3.avif" alt="img" width={800} height={600} />
          </div>
        </div>
      </div>
      <div className="abt_mob_txt">
        <div className="about_txt_img">
          <Image className='cover' src="/images/aboutpage/img4.avif" alt="img" width={400} height={600} />
        </div>
        <p className='  text-base bold uppercase '>Behind Rare Element</p>
        <div className=" text-base">
          <p className='italic thin'>“ Nahara was born from the idea that beauty should be honest and thoughtful. We create slowly, with intention, allowing every design to carry a story. What you see here is more than a brand it’s a journey shaped with clarity, purpose, and heart.”</p>
        </div>
      </div>
      <div className=" abt_mob_txt_2">
        <div className="marq_img_6">
          <Image className='cover' src="/images/aboutpage/img5.avif" alt="img" width={400} height={600} />
        </div>
        <p className='  text-base bold uppercase '>Quiet Craftsmanship</p>
        <div className=" text-base">
          <p className='italic thin'>“ Blending inventive design with next-gen craftsmanship, our jewellery celebrates a new wave of elegance: fun, fearless silhouettes paired with the kind of delicate finishing that makes each piece feel truly special. “</p>
        </div>
      </div>

      <ScrollVelocityThree />

      <div className="about_sticker_section">
        <Image className=' sticker_bg_img cover' src="/images/aboutpage/about_sticker_bg.webp" alt="img" fill />

        <img className='mobile_sticker_1' src="/images/aboutpage/mobile_stickr_1.png" alt="img" />
        <img className='about_sticker_1' src="/images/aboutpage/desktop_sticker_1.png" alt="img"  />

        <img className='about_sticker_2' src="/images/aboutpage/sticker_2.png" alt="img"  />
      </div>
    </>
  );
}
