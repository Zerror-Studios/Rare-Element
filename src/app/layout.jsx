import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import FacebookPixel from "@/components/common/FacebookPixel";
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
  metadataBase: new URL("https://nahara.co.in"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_GRAPHQL_API_URL} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preload" as="image" href="/images/homepage/hero_poster.webp" fetchPriority="high" />

        {/* Google Tag Manager - Global base code */}
        <Script
          id="gtm-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M6WXDQ3P');
          `,
          }}
        />

        {/* Facebook Pixel - Global base code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '26639049565785927');
            fbq('track', 'PageView');
          `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M6WXDQ3P"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        {/* Facebook Pixel (noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=26639049565785927&ev=PageView&noscript=1"
            alt="facebook pixel"
          />
        </noscript>

        {/* Google Analytics - Deferred Loading */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0FTD3SQ58J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0FTD3SQ58J');
          `}
        </Script>

        <FacebookPixel />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
