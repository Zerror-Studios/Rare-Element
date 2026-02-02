import React from "react";
import SeoHeader from "@/components/seo/SeoHeader";

const shippingReturns = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div id="legal-page" className="text-lg">
        <h1 className=" text-2xl">Shipping And Returns</h1>

        <div className="legal-container">
          <p className="text-2xl ">Shipping Policy</p>
          <p className="subheading-legal"><strong>How long will it take to deliver my order (domestic and international)?</strong></p>
          <ul>
            <li>Orders in India are normally delivered in 1-2 business days (City or State), 3-5 business days (Metro to Metro), and 5-7+ business days (Rest of India) after they have been shipped. Delivery times may vary depending on the shipping address and other considerations (public holidays, severe weather, etc.)</li>
          </ul>
          <p className="text-2xl">Returns & Exchange Policy</p>
          <p className="subheading-legal"><strong>Terms Of The Exchange Policy:</strong></p>
          <ul>
            <li>Products will be only exchanged in the case of delivering a wrong product or the wrong product size or if a damaged product has been delivered.</li>
            <li>The customer needs to inform us within 15 days of the product being received of any issue related to wrong product being delivered or quality issues</li>
            <li>There is no refund Provided by the company.</li>
          </ul>
          <p className="subheading-legal"><strong>Procedure For Product Returns & Exchange:</strong></p>
          <ul>
            <li>Once a customer submits a complaint for a product return/exchange via e-mail, our Quality Control Team will review your complaint and, if our team gives us a green signal, we will arrange a reversal order. The courier will pick up the parcel from the customer's location and will ship it to us within 3 - 7 days. Once the goods arrive at our warehouse, we will send the customer a replacement within 3-4 business days.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default shippingReturns;

export async function getStaticProps() {
  const meta = {
    title: "Shipping & Return Policy – Nahara Jewellery",
    description: "View Nahara’s shipping guidelines, delivery information, and return/exchange policies for all jewellery purchases.",
    keywords: ["jewellery shipping policy", "return policy", "Nahara delivery"],
    primaryKeywords: ["Nahara shipping policy"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Shipping & Return Policy – Nahara Jewellery",
      description: "Learn about our delivery and return policies.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Shipping & Return Policy – Nahara Jewellery",
      description: "Read Nahara’s shipping and returns policy.",
    }
  };

  return { props: { meta } };
}

