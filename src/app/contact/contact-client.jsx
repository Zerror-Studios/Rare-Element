"use client";

import React, { useState } from 'react'
import SeoHeader from '@/components/seo/SeoHeader'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import ContactForm from '@/components/contact/ContactForm';
import Faq from '@/components/contact/Faq';
import Image from 'next/image';

const slideBoxData = [
  {
    id: 1,
    title: "Need Help",
    desc: "Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.",
  },
  {
    id: 2,
    title: "Contact Email",
    desc: "contact@nahara.co.in",
  },
  {
    id: 3,
    title: "Contact Number",
    desc: "+91 - 9999999999",
  },
  {
    id: 4,
    title: "Location",
    desc: "Ge 1080 G Tower East Wing 1st Floor Bharat Diamond Bourse Bandra Kurla Complex 27 Maharashtra 400051",
  }
]

export default function ContactClient({ meta }) {

  const [imgReady, setImgReady] = useState(false)

  useGSAP(() => {

    gsap.to([".contact_bg_img", ".anim_ttt", ".slider_box"], {
      opacity: 1,
      stagger: 0.2,
    })

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact_form_paren",
        end: "bottom bottom",
        start: "top top",
        scrub: true,
      },
    })

    tl.to(".slider_box_paren", {
      xPercent: -100,
      ease: "linear",
    })
    if (window.innerWidth < 750) return
    tl.to(".contact_img_paren", {
      width: "60%",
      ease: "linear",
    }, "<+=0.05")
    tl.to(".contact_bg_img", {
      x: -250,
      ease: "linear",
    }, "<")
    tl.from("#form", {
      opacity: 0,
      ease: "linear",
    }, "<0.25")
  })

  return (
    <>
      <SeoHeader meta={meta} />
      <div className="contact_form_paren">
        <section id="contact_form" >
          <div className="contact_img_paren ">
            {!imgReady && <div style={{ position: "absolute", inset: "0", zIndex: "-2" }} className="skeleton_animate skeleton_box"></div>}
            <Image width={1920} height={1080} onLoad={() => setImgReady(true)} className='contact_bg_img hidden' src="/images/contact_bg.avif" alt="img" />
            <div className="ct_box">
              <h1 className='anim_ttt hidden text-3xl font-semibold'>Contact Us</h1>
              <p className=' anim_ttt hidden text-base uppercase'>Need help? Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.</p>
            </div>
          </div>
          <div className="slider_box_paren">
            {slideBoxData?.map((item, i) => (
              <div key={i} className="slider_box hidden">
                <p className='text-lg'>( 0{item.id} )</p>
                <h2 className='text-xl font-semibold'>{item.title}</h2>
                <div className="desc_prn">
                  <p className='text-lg'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <ContactForm />
        </section>
      </div>
      <Faq />
    </>
  );
}
