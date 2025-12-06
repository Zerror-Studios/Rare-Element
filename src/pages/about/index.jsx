import React from 'react'
import Marquee from 'react-fast-marquee'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ScrollVelocity from '@/components/about/ScrollVelocity';

gsap.registerPlugin(ScrollTrigger)


const About = () => {

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
        // markers: true
      },
      y: 150,
      ease: "linear"
    })


    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".about_sticker_section",
        start: "top 60%",
        end: "bottom top",
        // scrub: true,
        toggleActions: "play none none reverse"
        // markers: true
      },
    })
    tl.from(".about_sticker_1", {
      y: 10,
      opacity: 0,
      rotate: 25,
      duration: .5,
      ease: "expo.out"
    })
    tl.from(".about_sticker_2", {
      y: 10,
      opacity: 0,
      rotate: -25,
      duration: .5,
      ease: "expo.out"
    }, "<+=0.1")

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
        // toggleActions: "play none none reverse"
        // markers: true
      },
    })


  })

  return (
    <>
      <div className="about_header">
        <div className="featured_header text-center mb-6">
          <p className="featured_subtitle thin text-base uppercase text-gray-600">A Note From Our Founder</p>
          <h2 className="featured_title text-3xl font-semibold">The Essence of Nahara</h2>
        </div>
      </div>

      <div className="abt_img_galry">
        <div className="about_marque_img_paren_1">
          <div className="marq_img_paren">
            <div className="marq_img_1">
              <img className='cover' src="/images/aboutpage/about_img1.webp" alt="loading" />
            </div>
            <div className="marq_img_2">
              <img className='cover' src="/images/aboutpage/about_img2.webp" alt="loading" />
            </div>
          </div>
          <div className="marq_img_3">
            <img className='cover' src="/images/aboutpage/landscape_img1.webp" alt="loading" />
          </div>
        </div>
      </div>
      <div className="abt_mob_txt">
        <div className="about_txt_img">
          <img className='cover' src="/images/aboutpage/desc_img.webp" alt="loading" />
        </div>
        <p className='  text-base bold uppercase '>Behind Rare Element</p>
        <div className=" text-base">
          <p className='italic thin'>“ Nahara was born from the idea that beauty should be honest and thoughtful. We create slowly, with intention, allowing every design to carry a story. What you see here is more than a brand it’s a journey shaped with clarity, purpose, and heart.”</p>
        </div>
      </div>

      <ScrollVelocity />

      <div className="about_sticker_section">
        <img className=' sticker_bg_img cover' src="/images/aboutpage/about_sticker_bg.webp" alt="loading" />

        <img className='mobile_sticker_1' src="/images/aboutpage/mobile_stickr_1.png" alt="loading" />
        <img className='about_sticker_1' src="/images/aboutpage/desktop_sticker_1.png" alt="loading" />

        <img className='about_sticker_2' src="/images/aboutpage/sticker_2.png" alt="loading" />
      </div>

    </>
  )
}

export default About