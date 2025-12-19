import { useGSAP } from '@gsap/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import WhiteBorderBtn from '../buttons/WhiteBorderBtn'
gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
  const pathname = usePathname()

  useGSAP(() => {
    if (window.innerWidth < 1020) return
    gsap.to(".home_hero_video", {
      scrollTrigger: {
        trigger: ".home_hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
        // markers: true
      },
      y: 200,
      ease: "linear"
    })
  }, [pathname])


  useEffect(() => {
    var height

    if (window.innerWidth > 750) {
      height = "72vh"
    } else {
      height = "45rem"
    }

    gsap.to(".home_hero", {
      height: height,
      duration: 1,
      ease: "ease-secondary"
    })
    if (window.innerWidth < 750) return
    gsap.set(".home_hero_inner, .category_header, .home_category_paren", {
      opacity: 0
    })
    gsap.to(".home_hero_inner, .category_header, .home_category_paren", {
      opacity: 1,
      delay: 0.5,
      stagger: 0.1,
      duration: 1,
      ease: "ease-secondary"
    })
  }, [pathname])

  return (
    <>
      {pathname === "/" && (
        <div className="info_header center">
          <p className='text-xs'> Free Shipping on orders above ₹  3,000 </p>
        </div>
      )}
      <div className="dummy_hero_div"></div>
      <div className="home_hero">
        <video className=' home_hero_video cover' loop muted playsInline autoPlay src="/videos/hero_video.mp4"></video>
        <div className="home_hero_inner">
          <h2 className='text-3xl'>World of Nahara</h2>
          <Link scroll={false} href="/products">
            <WhiteBorderBtn text={"Discover"} />
          </Link>
        </div>
      </div>
    </>
  )
}

export default Hero