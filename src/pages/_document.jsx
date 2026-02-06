import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://assets.nahara.co.in" />
        <link rel="dns-prefetch" href="https://assets.nahara.co.in" />
        {/* Preconnect to GraphQL API */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_GRAPHQL_API_URL} />
        {/* Google Tag Manager - Global base code */}
        <script
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
        {/* Global site tag (gtag.js) - Google Analytics */}
        <script
          src="https://www.googletagmanager.com/gtag/js?id=G-0FTD3SQ58J"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0FTD3SQ58J');
          `,
          }}
        />
      </Head>
      <body>
        {/* <!-- Google Tag Manager (noscript) --> */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M6WXDQ3P"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* <!-- End Google Tag Manager (noscript) --> */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
