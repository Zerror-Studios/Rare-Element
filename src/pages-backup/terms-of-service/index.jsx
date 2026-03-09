import React from "react";
import SeoHeader from "@/components/seo/SeoHeader";

const TermsOfService = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div id="legal-page" className="text-lg">
        <h1 className="text-2xl">Terms Of Service</h1>
        <div className="legal-container">
          <p>
            By using our website ("Service"), you agree to the following terms:
          </p>
          <p>
            <strong>Eligibility:</strong> You must be at least 18 years old or of
            legal age in your jurisdiction to use our Service.
          </p>
          <p>
            <strong>Account:</strong> If you create an account, you are
            responsible for maintaining its confidentiality and are liable for all
            activities under your account.
          </p>
          <p>
            <strong>Prohibited Conduct:</strong> You agree not to engage in
            unlawful activities or interfere with the Service's functioning or
            others' use.
          </p>
          <p>
            <strong>Product Information:</strong> We strive for accurate product
            information, but errors may occur. We reserve the right to cancel
            orders due to pricing errors.
          </p>
          <p>
            <strong>Intellectual Property:</strong> The Service's content is
            protected by intellectual property rights and may not be used without
            our permission.
          </p>
          <p>
            <strong>Privacy:</strong> Your personal information is treated
            according to our Privacy Policy.
          </p>
          <p>
            <strong>Disclaimer:</strong> The Service is provided "as is" and we do
            not guarantee its availability, accuracy, or suitability for your
            needs.
          </p>
          <p>
            <strong>Limitation of Liability:</strong> We are not liable for any
            damages arising from your use of the Service.
          </p>
          <p>
            <strong>Termination:</strong> We may terminate or suspend your access
            to the Service without prior notice.
          </p>
          <p>
            <strong>Governing Law:</strong> These terms are governed by the laws
            of [Jurisdiction], and any disputes shall be subject to the exclusive
            jurisdiction of its courts.
          </p>
          <p>
            <strong>Changes:</strong> We may modify these terms at any time
            without prior notice. Continued use of the Service constitutes
            acceptance of the revised terms.
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;

export async function getStaticProps() {
  const meta = {
    title: "Terms of Service – Nahara Jewellery",
    description: "Review the terms and conditions for using the Nahara website and purchasing fine jewellery online.",
    keywords: ["terms of service", "Nahara terms", "jewellery policies"],
    primaryKeywords: ["Nahara terms of service"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Terms of Service – Nahara Jewellery",
      description: "Review our website usage and purchase terms.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Terms of Service – Nahara Jewellery",
      description: "Read Nahara’s terms of service.",
    }
  };

  return { props: { meta } };
}
