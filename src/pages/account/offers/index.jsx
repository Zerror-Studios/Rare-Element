import React from 'react'
import SeoHeader from '@/components/seo/SeoHeader';
import AccountLayout from '@/components/layouts/AccountLayout';
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb';
import Image from 'next/image';


const offers = [
  {
    img: "/images/homepage/footer_reels/rings.JPG",
    title: "Flat 90% off on any purchase",
    code: "NAHARA90",
  },
];

const Purchases = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Offers"} />
        <div className="purchases_rightSection">
          <h1 className="account_heading text-xl">Account and Rewards</h1>
          <div className="account_gridBox">
            {offers.map((offer, index) => (
              <div key={index} className="account_offerCard">
                <div className="account_imgBox">
                  <Image
                    width={150}
                    height={200}
                    className="account_img"
                    src={offer.img}
                    alt={offer.title}
                    title={offer.title}
                  />
                </div>

                <div className="account_offerText">
                  <p className="account_offerTitle text-base uppercase">
                    {offer.title}
                  </p>
                  <p className="account_offerValidity text-base">
                    Code : &nbsp;
                    {offer.code}
                  </p>
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
