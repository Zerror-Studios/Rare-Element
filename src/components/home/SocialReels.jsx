import React from 'react'


export const SocialCardData = [
  {
    id: 1,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/1_HP_Mobile_Cover.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Hawaii_CUT_1_1.mp4",
    title: "Customisation Available",
    description: "Craft jewellery that reflects your unique style. Tailored designs, personalized details, and unmatched craftsmanship.",
  },
  {
    id: 2,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/1_HP_Cover_Mobile_ADV23.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Tulle_CUT_1_1.mp4",
    title: "Free Shipping",
    description: "Enjoy seamless delivery at no extra cost. Fast, secure, and insured shipping for every order.",
  },
  {
    id: 3,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/7_HP_Cover_video_Mobile.jpg",
    title: "Years of Industry Experience",
    titleSpan: "50+",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Opera_CUT_1_1.mp4",
    description: "A legacy of trust and excellence. Decades of mastery ensure precision, quality, and timeless design.",
  },
  {
    id: 4,
    img: "https://www.buccellati.com/media/wysiwyg/SOA_HP.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Ramage_Cut_1_1.mp4",
    title: "Dedicated Customer Service",
    description: "Our team is always ready to assist you. From inquiries to support, experience smooth and personalised service.",
  },
]

const SocialReels = () => {
  return (
    <>
      <div className="social_header">
        <p className="social_subtitle text-base thin uppercase">Follow us on</p>
        <h2 className="social_title text-3xl">Instagram</h2>
        <p className='text-base  underline '>@rareelement</p>
      </div>
      <div className="socialCard_section scroller_none padding">
        {SocialCardData?.map((item, i) => (
          <div key={i} className="socialCard_box">
            <video className='cover socialCard_box_vid ' loop autoPlay muted playsInline src={item.vid}></video>
            <div className="socialCard_image_wrapper">
              <img
                className="socialCard_image"
                src={item.img}
                alt="Bespoke Jewellery Design"
              />
            </div>

            <h2 className="socialCard_title text-xl  uppercase">
              <span className=" text-4xl thin">{item.titleSpan}</span>{" "}
              {item.title}
            </h2>
            <p className="socialCard_description thin text-base">
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </>
  )
}

export default SocialReels