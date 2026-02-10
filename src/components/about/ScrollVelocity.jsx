import React from 'react'
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import AboutImageEffect from './AboutImageEffect'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(ScrollTrigger);

const ScrollVelocity = () => {

  useGSAP(() => {

    gsap.from([".marq_img_1", ".marq_img_2", ".marq_img_3", ".marq_img_4,.marq_img_6,.about_txt_img,.about_txt_img_2"], {
      opacity: 0,
      delay: 1,
      stagger: 0.1,
    })

    gsap.to(".about_marquee_paren", {
      scrollTrigger: {
        trigger: ".about_mr_pr",
        start: "top top",
        end: "bottom bottom",
        // pin: true,
        // anticipatePin: 1,
        // end:"+=200%",
        scrub: true,
        // markers:true
      },
      xPercent: -58,
      ease: "linear",
    })
  })

  return (
    <div className='about_mr_pr'>
      <div className="about_marquee_paren_sticky">
        <div className="about_marquee_paren">

          <div className="about_marque_img_paren_1">
            <div className="marq_img_paren">
              <div
                className="marq_img_1">
                <AboutImageEffect imageUrl="/images/aboutpage/img1.avif" />
              </div>
              <div className="marq_img_2">
                <AboutImageEffect imageUrl="/images/aboutpage/img2.avif" />
              </div>
            </div>
            <div className="marq_img_3">
              <AboutImageEffect imageUrl="/images/aboutpage/img3.avif" />
            </div>
          </div>

          <div className="about_marq_txt_paren center">
            <div className="about_txt_upper">
              <div className="about_txt_img_paren center">
                <div className="about_txt_img">
                  <AboutImageEffect imageUrl="/images/aboutpage/img4.avif" />
                </div>
              </div>
              <p className='  text-base uppercase '>Behind Rare Element</p>
            </div>
            <div className=" text-xl">
              <p className='thin italic'> “ Nahara brings a fresh spark to modern jewellery. Every piece is dreamed up, designed, and crafted under one roof, giving us the freedom to play with form, experiment with detail, and chase bold ideas. “</p>
            </div>
          </div>

          <div className="about_marque_img_paren_2">
            <div className="marq_img_6">
              <AboutImageEffect imageUrl="/images/aboutpage/img5.avif" />
            </div>
          </div>

          <div className="about_marq_txt_paren start">
            <div className="about_txt_upper">
              <div className="about_txt_img_paren start">
                <div className="about_txt_img_2">
                  <AboutImageEffect imageUrl="/images/aboutpage/img6.avif" />
                </div>
              </div>
              <p className='  text-base uppercase '>Quiet Craftsmanship</p>
            </div>
            <div className=" text-xl">
              <p className='thin italic'> “ Blending inventive design with next-gen craftsmanship, our jewellery celebrates a new wave of elegance: fun, fearless silhouettes paired with the kind of delicate finishing that makes each piece feel truly special. “</p>
            </div>
          </div>

          <div className="about_marque_img_paren_2">
            <div className="marq_img_4">
              <AboutImageEffect imageUrl="/images/aboutpage/img7.avif" />
            </div>
            <div className="marq_img_paren_next">
              <div className="marq_img_1">
                <AboutImageEffect imageUrl="/images/aboutpage/img8.avif" />
              </div>
              <div className="marq_img_2">
                <AboutImageEffect imageUrl="/images/aboutpage/img9.avif" />
              </div>
            </div>
          </div>

          <div className="about_marq_txt_paren">
            <div className="about_txt_upper">
              <div className="about_txt_img_paren">
                <div className="about_txt_img_3">
                  <AboutImageEffect imageUrl="/images/aboutpage/img10.avif" />
                </div>
              </div>
              <p className='  text-base uppercase '>Design With Intention</p>
            </div>
            <div className=" text-xl">
              <p className='thin italic'>“ Our work is guided by a belief in slow creation and truthful design. Each element reflects the balance between simplicity and depth.”</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ScrollVelocity