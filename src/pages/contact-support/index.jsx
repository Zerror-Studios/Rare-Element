import ContactForm from '@/components/forms/ContactForm'
import React from 'react'

const index = () => {
  return (
    <>
      <section id="contact_form" >
        <div className=""></div>
        <div className="animate-item">
          <ContactForm />
        </div>
        <div className="animate-item">
          <div id="address" className='text-base'>
            <div className="elem elem-lf">
              <p>
                We believe in the power of digital, and we love collaborating with
                brands that feel the same. Let&apos;s connect.
              </p>
            </div>
            <div className="elem">
              <div className="add">
                <p className='text-base uppercase bold'>Business Enquiries</p>
                <a href="">nahara@gmail.com</a>
                <a href="">+91 99999-99999</a>
              </div>
              <div className="add">
                <p className='text-base uppercase bold'>Address</p>
                <p>
                  Bankeybihari Holdings <br />
                  B5, 3rd floor, Everest Apt., <br />
                  Pt. Madan Mohan Malviya Marg, <br />
                  Tardeo, Mumbai-400 034
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default index