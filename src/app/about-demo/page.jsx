import AboutClient from "./about-client";

// A draft kept off the live site (main c40fa33 moved it from /about): no
// link, not in the sitemap, and never indexed.
export const metadata = {
  robots: { index: false, follow: false },
  title: "About Us – Nahara Fine Jewellery",
  description: "Learn about Nahara, our story, craftsmanship, and commitment to creating luxury fine jewellery for the modern woman.",
};

export default function Page() {
  return <AboutClient />;
}
