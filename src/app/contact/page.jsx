import ContactClient from "./contact-client";

export const metadata = {
  title: "Contact Us – Nahara Fine Jewellery Support",
  description: "Need help? Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.",
  keywords: [
    "Nahara contact",
    "jewellery customer support",
    "Nahara help"
  ],
  openGraph: {
    title: "Contact Us – Nahara Fine Jewellery Support",
    description: "We’re here to help. Reach out via email or phone.",
  },
};

export default function Page() {
  const meta = {
    title: "Contact Us – Nahara Fine Jewellery Support",
    description: "Need help? Contact Nahara for support, product inquiries, custom jewellery requests, and order assistance.",
    keywords: ["Nahara contact", "jewellery customer support", "Nahara help"],
  };

  return <ContactClient meta={meta} />;
}
