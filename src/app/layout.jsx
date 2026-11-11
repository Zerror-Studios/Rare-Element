import { Inter } from "next/font/google";
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
    // suppressHydrationWarning: the kit consent script adds data-zcom-consent
    // to <html> before React hydrates (kit 1.0.5), which is expected
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://assets.nahara.co.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.nahara.co.in" />
        {/* The three fonts above the fold, at their public URLs (fontSetting.css),
            so text doesn't reflow when they arrive late (CLS) */}
        <link rel="preload" href="/fonts/raleway/Raleway-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/raleway/Raleway-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/safira/SafiraMarchPersonalUse-gxeKY.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Consent Mode v2 defaults ("denied", then the stored choice)
            before any tag. The kit's ZcomTags loads GTM/GA4 with analytics
            consent and the Meta Pixel / Google Ads with ads consent. The
            script is the kit's constant, no shopper or tenant data. */}
        {/* A plain <script>, not next/script: in the App Router
            beforeInteractive runs only after Next's runtime loads, after
            the first paint, and this must mark <html> before it (kit 1.0.5). */}
        <script
          id="consent-default"
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
