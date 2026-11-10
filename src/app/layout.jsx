import { Inter } from "next/font/google";
import Script from "next/script";
import { CONSENT_DEFAULT_SCRIPT } from "@zcom/storefront-kit/core";
import { Providers } from "./providers";
import ConsentBanner from "@/components/common/ConsentBanner";
import { SITE_URL, SITE_URL_CONFIGURED } from "@/utils/env";
import "../styles/globals.css";
import "../styles/allCssImport.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Nahara – Luxury Fine Jewellery Crafted for Modern Elegance",
    template: "%s | Nahara Jewellery"
  },
  description: "Discover handcrafted fine jewellery at Nahara featuring diamonds, gold, sterling silver, and contemporary designs. Shop rings, earrings, bracelets, and necklaces.",
  keywords: ["Nahara jewellery", "fine jewellery India", "diamond jewellery", "gold jewellery", "925 silver jewellery"],
  authors: [{ name: "Nahara" }],
  // SF-4: one domain constant; each route sets its own canonical.
  metadataBase: new URL(SITE_URL),
  // W2V-C-04: a build without a site origin is never indexed.
  robots: {
    index: SITE_URL_CONFIGURED,
    follow: SITE_URL_CONFIGURED,
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://assets.nahara.co.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.nahara.co.in" />
        <link rel="preload" as="image" href="/images/homepage/hero_poster.webp" fetchPriority="high" />

        {/* Consent Mode v2 defaults ("denied", then the stored choice)
            before any tag. The kit's ZcomTags loads GTM/GA4 with analytics
            consent and the Meta Pixel / Google Ads with ads consent. The
            script is the kit's constant, no shopper or tenant data. */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning >
        <Providers>{children}</Providers>
        <ConsentBanner />
      </body>
    </html>
  );
}
