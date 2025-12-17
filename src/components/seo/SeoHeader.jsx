import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import WebPageSchema from "./WebPageSchema";
import NewsMediaOrganizationSchema from "./NewsMediaOrganizationSchema";
import { Const } from "@/utils/Constant";
import SiteNavigationSchema from "./SiteNavigationSchema";

const SeoHeader = ({ meta }) => {
  const router = useRouter();
  const canonical = `${Const.ClientLink}/${router.asPath?.slice(1)}`;
  return (
    <Head>
      <title>{meta?.title ?? ""}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      <meta name="description" content={meta?.description ?? ""} />
      <meta name="keywords" content={meta?.keywords ?? ""} />
      <meta name="author" content={meta?.author ?? Const.Brand} />
      <meta
        name="robots"
        content={
          `${meta?.robots}, max-image-preview:large` ??
          "index,follow, max-image-preview:large"
        }
      />
      <link rel="canonical" href={meta?.canonical ?? canonical} />
      {/* OG Tags */}
      {/* <meta property="fb:app_id" content="446498535209610" /> */}
      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta?.og?.title ?? ""} />
      <meta property="og:description" content={meta?.og?.description ?? ""} />
      <meta property="og:url" content={meta?.canonical ?? canonical} />
      <meta property="og:site_name" content={Const.Brand} />
      <meta property="og:image" content={meta?.og?.image ?? ""} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {/* Twitter Tag */}
      <meta
        name="twitter:card"
        content={meta?.twitter?.card ?? "summary_large_image"}
      />
      <meta
        name="twitter:title"
        content={meta?.twitter?.title ?? meta?.title}
      />
      <meta
        name="twitter:description"
        content={meta?.twitter?.description ?? meta?.description}
      />
      <meta name="twitter:site" content={"@nahara"} />
      <meta name="twitter:image" content={meta?.twitter?.image ?? ""} />
      <meta name="twitter:creator" content={"@nahara"} />
      <meta charSet="UTF-8" />
      <meta httpEquiv="Content-Type" content="text/html;charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon/android-chrome-192x192.png" />
      <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
      <link
        rel="alternate"
        hrefLang="en-in"
        href={meta?.canonical ?? canonical}
      />
      <WebPageSchema
        name={meta?.title ?? ""}
        description={meta?.description ?? ""}
        url={meta?.canonical ?? canonical}
      />
      <NewsMediaOrganizationSchema
        name={"Nahara"}
        clientLink={`${Const.ClientLink}/`}
        logoUrl={`${Const.ClientLink}/logo.svg`}
        address={{
          streetAddress: "Bankeybihari Holdings B5, 3rd floor, Everest Apt., Pt. Madan Mohan Malviya Marg, Tardeo",
          addressLocality: "Mumbai",
          addressRegion: "Maharashtra",
          postalCode: "400034",
          addressCountry: "IN",
        }}
        contact={{
          telephone: "+919833983775",
          contactType: "Customer Service",
          areaServed: "IN",
          availableLanguage: "English",
        }}
        sameAs={[
          "https://www.instagram.com/",
          "https://www.linkedin.com/",
          "https://www.facebook.com/",
        ]}
      />
      <SiteNavigationSchema />
    </Head>
  );
};

export default SeoHeader;
