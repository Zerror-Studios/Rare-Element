import { useGSAP } from '@gsap/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
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
                <video className=' home_hero_video cover' loop muted playsInline autoPlay src="https://365ayearof.cartier.com/hero-carousel/1_Creative_Alchemy_Desktop%20test%20loop%208%20sec.mp4"></video>
                <div className="home_hero_inner">
                    <h2 className='text-3xl'>The Aurora Collection</h2>
                    <Link scroll={false} href="/products">
                        <button className='green_button'><p className='text-base ' >Discover</p></button>
                    </Link>
                </div>
            </div>
        </>
    )
}

export default Hero