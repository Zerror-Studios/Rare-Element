import React from 'react'
import SeoHeader from '@/components/seo/SeoHeader'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import ContactForm from '@/components/contact/ContactForm';
import Faq from '@/components/contact/Faq';
gsap.registerPlugin(ScrollTrigger)

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
const ContactSupport = ({ meta }) => {

  useGSAP(() => {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#contact_form",
        start: "top top",
        anticipatePin: 1,
        scrub: .4,
        // markers:true,
        pin: true,
      },
    })

    if (window.innerWidth > 750) {
      tl.to(".slider_box_paren", {
        xPercent: -100,
        ease: "linear",
        duration: .5,
      })
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
        duration: .5,
        ease: "linear",
      }, "<0.25")

    } else {
      tl.to(".slider_box_paren", {
        xPercent: -90,
        ease: "linear",
        duration: .5,
      })
    }


  })

  return (
    <>
      <SeoHeader meta={meta} />
      <section id="contact_form" >
        <div className="contact_img_paren ">
          <img className='contact_bg_img' src="https://images.unsplash.com/photo-1711462579127-d25e6ea88244?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="loading" />
          <div className="ct_box">
            <h2 className=' text-3xl font-semibold'>Contact Us</h2>
            <p className='text-base uppercase'>Need help? Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.</p>
          </div>

        </div>
        <div className="slider_box_paren">
          {slideBoxData?.map((item, i) => (
            <div key={i} className="slider_box">
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
      <Faq />
    </>
  )
}

export default ContactSupport

export async function getStaticProps() {
  const meta = {
    title: "Contact Us – Nahara Fine Jewellery Support",
    description: "Need help? Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.",
    keywords: [
      "Nahara contact",
      "jewellery customer support",
      "Nahara help"
    ],
    primaryKeywords: ["Nahara contact"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Contact Us – Nahara Fine Jewellery Support",
      description: "Reach out to the Nahara team for assistance and inquiries.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Contact Us – Nahara Fine Jewellery Support",
      description: "Need assistance? Contact Nahara support.",
    }
  };

  return { props: { meta } };
}