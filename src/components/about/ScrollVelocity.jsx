import React from 'react'
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import AboutImageEffect from './AboutImageEffect'
import { useGSAP } from '@gsap/react'
gsap.registerPlugin(ScrollTrigger);

const ScrollVelocity = () => {

  useGSAP(() => {
    gsap.to(".about_marquee_paren", {
      scrollTrigger: {
        trigger: ".about_mr_pr",
        start: "top top",
        end:"bottom bottom",
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
              <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
            </div>
            <div className="marq_img_2">
              <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1631982690223-8aa4be0a2497?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
            </div>
          </div>
          <div className="marq_img_3">
            <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1619119069152-a2b331eb392a?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </div>
        </div>

        <div className="about_marq_txt_paren center">
          <div className="about_txt_upper">
            <div className="about_txt_img_paren center">
              <div className="about_txt_img">
                <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1620656798579-1984d9e87df7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
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
            <AboutImageEffect imageUrl="https://plus.unsplash.com/premium_photo-1681276169939-5ad54d5de5fd?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </div>
        </div>

        <div className="about_marq_txt_paren start">
          <div className="about_txt_upper">
            <div className="about_txt_img_paren start">
              <div className="about_txt_img_2">
                <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1581090465980-58ea88b43443?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
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
                <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
          </div>
          <div className="marq_img_paren_next">
            <div className="marq_img_1">
              <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1708222170510-bb7d358798f0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
            </div>
            <div className="marq_img_2">
              <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1634229537034-16d6a751d91b?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
            </div>
          </div>
        </div>

        <div className="about_marq_txt_paren">
          <div className="about_txt_upper">
            <div className="about_txt_img_paren">
              <div className="about_txt_img_3">
            <AboutImageEffect imageUrl="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
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