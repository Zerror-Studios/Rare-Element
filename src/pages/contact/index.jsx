import React from 'react'
import SeoHeader from '@/components/seo/SeoHeader'
import ContactForm from '@/components/forms/ContactForm'

const ContactSupport = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
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
                <p className=' ct_head text-base uppercase bold'>Business Enquiries</p>
                <a className='underline' href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs">contact@nahara.co.in</a>
                <a className='underline' href=" tel:+91 99999-99999">+91 99999-99999</a>
              </div>
              <div className="add">
                <p className='ct_head text-base uppercase bold'>Address</p>
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