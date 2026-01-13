import React from 'react'
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';


const offers = [
  {
    img: "https://image.hm.com/content/dam/Hm_Member_and_Loyalty/seasonal-images-loyalty/AW25/1012a_101_09_020_4x5.jpg?imwidth=1536",
    title: "For members who love music",
    validity: "Valid until: 04/10/2025",
  },
  {
    img: "https://image.hm.com/content/dam/Hm_Member_and_Loyalty/cms/2025/july/7022D-4x5-hotel-deluxe-bed.jpg?imwidth=1536",
    title: "Flat 20% off on Home purchase",
    validity: "Valid until: 04/10/2025",
  },
  {
    img: "https://image.hm.com/content/dam/Hm_Member_and_Loyalty/cms/2024/october/spotifypremium_reward_4x5.jpg?imwidth=1536",
    title: "For members who love music",
    validity: "Valid until: 04/10/2025",
  },
];

const Purchases = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Offers"} />
        <div className="purchases_rightSection">
          <h1 className="account_heading text-xl">Account and Rewards</h2>

          <div className="account_gridBox">
            {offers.map((offer, index) => (
              <div key={index} className="account_offerCard">
                <div className="account_imgBox">
                  <img
                    className="account_img"
                    src={offer.img}
                    alt={offer.title}
                    title={offer.title}
                  />
                </div>

                <div className="account_offerText">
                  <p className="account_offerTitle text-base uppercase">{offer.title}</p>
                  <p className="account_offerValidity text-base">{offer.validity}</p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </AccountLayout>
    </>
  )
}

export default Purchases

export async function getStaticProps() {
  const meta = {
    title: "Exclusive Offers | Best Deals on Jewellery – Nahara",
    description:
      "Discover exclusive discounts and offers on premium handcrafted jewellery. Limited-time deals on rings, earrings, necklaces, bracelets and more.",
    keywords: [
      "jewellery offers",
      "discounts",
      "Nahara deals",
      "exclusive jewellery sale"
    ],
    primaryKeywords: ["offers", "discounts"],
    author: "Nahara",
    robots: "index,follow",
    og: {
      title: "Exclusive Offers | Nahara",
      description:
        "Explore the latest jewellery deals and exclusive savings at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Exclusive Offers | Nahara",
      description:
        "Discover premium jewellery at special discounted prices.",
    }
  };

  return { props: { meta } };
}
