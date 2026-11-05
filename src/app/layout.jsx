import { Suspense } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import FacebookPixel from "@/components/common/FacebookPixel";
import ConsentBanner from "@/components/common/ConsentBanner";
import { getConsentDefaultScript } from "@/utils/consent";
import { resolveTagIds } from "@/utils/tracking-config";
import { getStorefrontTrackingConfig } from "@/lib/tracking-config";
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

export default async function RootLayout({ children }) {
  // PRD-034 FR-1.2: the store's tag ids (backend first, env fallback; a
  // failed read is null and never breaks the page)
  const tagIds = resolveTagIds(await getStorefrontTrackingConfig());

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://assets.nahara.co.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.nahara.co.in" />
        <link rel="preload" as="image" href="/images/homepage/hero_poster.webp" fetchPriority="high" />

        {/* PRD-014 FR-1.9 (UX-05): Consent Mode v2 defaults ("denied")
            before any tag. GTM, GA, the Meta Pixel and the Google Ads tag
            load only after consent (`components/common/ConsentBanner.jsx`;
            ads on "marketing" only, PRD-034 D8). */}
        <Script
          id="consent-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getConsentDefaultScript() }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning >
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
        <Providers>{children}</Providers>
        <ConsentBanner tagIds={tagIds} />
      </body>
    </html>
  );
}
