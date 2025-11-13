import React from 'react'


export const SocialCardData = [
  {
    id: 1,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/1_HP_Mobile_Cover.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Hawaii_CUT_1_1.mp4",
    title: "Bespoke Jewellery Design",
    description: "Created exclusively to express your individuality. Crafted with care and precision. A reflection of timeless elegance and beauty.",
  },
  {
    id: 2,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/1_HP_Cover_Mobile_ADV23.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Tulle_CUT_1_1.mp4",
    title: "Luxury Handcrafted Rings",
    description: "Where artistry meets precision in every curve. Designed to celebrate love and sophistication. A symbol of grace that endures forever.",
  },
  {
    id: 3,
    img: "https://www.buccellati.com/media/.renditions/wysiwyg/7_HP_Cover_video_Mobile.jpg",
    title: "Modern Timeless Elegance",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Opera_CUT_1_1.mp4",
    description: "Inspired by contemporary form and fluid motion. Crafted to enhance every moment of life. A design that balances power and poise.",
  },
  {
    id: 4,
    img: "https://www.buccellati.com/media/wysiwyg/SOA_HP.jpg",
    vid: "https://www.buccellati.com/media/wysiwyg/videos/PLP_Ramage_Cut_1_1.mp4",
    title: "Heritage Inspired Craftsmanship",
    description: "Rooted in tradition, refined through innovation. Each creation tells a story of devotion and mastery. A legacy of beauty passed through generations.",
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

            <h2 className="socialCard_title text-xl uppercase">{item.title}</h2>
            <p className="socialCard_description thin text-lg">
              {item.description}
            </p>
          </div>
        ))}
      </div>

    </>
  )
}

export default SocialReels