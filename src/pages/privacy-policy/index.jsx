import React from "react";
import SeoHeader from "@/components/seo/SeoHeader";
import Link from "next/link";

const privacyPolicy = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div id="legal-page" className="text-lg">
        <h2 className=" text-2xl">Privacy Policy</h2>
        <div className="legal-container">
          <p>
            [NAHARA] ("we" or "us") values your privacy and is committed to protecting your personal information. Here's a summary of how we collect, use, and share your data:
          </p>
          <p>
            <strong>Information We Collect:</strong> We may collect personal information such as contact details and payment information when you interact with us.
          </p>
          <p>
            <strong>Use of Information:</strong> We use your information to
            process orders, provide customer support, and improve our products
            and services.
          </p>
          <p>
            <strong>Sharing Your Information:</strong> We may share your
            information with trusted third parties for order fulfillment and
            marketing purposes.
          </p>
          <p>
            <strong>Cookies and Tracking:</strong> We use cookies to enhance
            your browsing experience and deliver personalized content and ads.
          </p>
          <p>
            <strong>Data Security:</strong> We take reasonable measures to
            protect your information, but no method is 100% secure.
          </p>
          <p>
            <strong>Your Choices:</strong> You have the right to access,
            correct, or delete your data and unsubscribe from marketing
            communications.
          </p>
          <p>
            <strong>Legal Entity Information</strong> <br />
            The NAHARA website is operated by RARE ELEMENT TRADING LLP.
          </p>
       
          <p>
            <strong>
              Registered address:
            </strong> <br />
            GE 1080 G TOWER <br />
            EAST WING 1ST FLOOR <br />
            BHARAT DIAMOND BOURSE BANDRA KURLA COMPLEX <br />
            27 MAHARASHTRA  <br />
            400051 <br />

          </p>
          <p>
            We respect your privacy and prioritize the protection of your personal information. When you use our service, we may request certain personally identifiable information that enables us to contact or identify you. </p>
          <p>
            This information may include, but is not limited to <br /> (1)Email address <br />
            (2)First name and last name <br /> (3) Phone number <br /> (4) Address <br /> (5) State
            or province <br /> (6) ZIP/Postal code <br /> (7) City
          </p>
          <p>
            We value your trust and are committed to protecting your personal information. We will not sell, distribute, or lease your personal information to any third party unless we have obtained your explicit permission or are legally obligated to do so.
          </p>
          <p>
            We strive to maintain accurate and complete information about you.
            If you believe that any information we hold about you is inaccurate
            or incomplete, please contact us promptly. You can reach us by
            writing or emailing us at{" "}
            <Link target="_blank" href="https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSKjgCNjxJKkzZhJktdvrWdssGbJXkRJqFwsZljDKHnPDRLXcrkzLKSLVtRgNBJQQtgTCQjs">
              contact@nahara.co.in
            </Link>
            , and we will promptly make the necessary updates or corrections.
          </p>
          <p>
            Your privacy is our priority, and we appreciate your cooperation in
            ensuring the accuracy of your personal information.
          </p>
        </div>
      </div>
    </>
  );
};

export default privacyPolicy;

export async function getStaticProps() {
  const meta = {
    title: "Privacy Policy – Nahara Jewellery",
    description: "Review Nahara's privacy policy to understand how we collect, use, and protect your personal information.",
    keywords: ["Nahara privacy policy", "data protection", "user privacy"],
    primaryKeywords: ["Nahara privacy policy"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Privacy Policy – Nahara Jewellery",
      description: "Learn how we protect your data at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Privacy Policy – Nahara Jewellery",
      description: "Understand Nahara’s privacy policy.",
    }
  };
  return { props: { meta } };
}