"use client";

import React from "react";
import { usePathname } from "next/navigation";
import WebPageSchema from "./WebPageSchema";
import NewsMediaOrganizationSchema from "./NewsMediaOrganizationSchema";
import { Const } from "@/utils/Constant";
import SiteNavigationSchema from "./SiteNavigationSchema";
import ProductSchema from "./ProductSchema";
import BreadcrumbSchema from "./BreadcrumbSchema";

const SeoHeader = ({ meta, productData, breadcrumbList }) => {
  const pathname = usePathname();
  const canonical = `${Const.ClientLink}${pathname}`;

  return (
    <>
      {/* 
        Note: Metadata (title, description, etc.) should be handled via the Metadata API 
        in App Router (page.js or layout.js). This component is kept for Schema injections 
        and legacy support during migration.
      */}
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
          streetAddress: "GE 1080 G TOWER EAST WING 1ST FLOOR BHARAT DIAMOND BOURSE BANDRA KURLA COMPLEX 27 MAHARASHTRA",
          addressLocality: "Mumbai",
          addressRegion: "Maharashtra",
          postalCode: "400051",
          addressCountry: "IN",
        }}
        contact={{
          telephone: "+919137159898",
          contactType: "Customer Service",
          areaServed: "IN",
          availableLanguage: "English",
        }}
        sameAs={[
          "https://www.instagram.com/nahara.jewellery/?igsh=MXgwcmQ2ODhnaTR3ag%3D%3D#",
        ]}
      />
      <SiteNavigationSchema />
      {productData && <ProductSchema product={productData} />}
      {breadcrumbList && <BreadcrumbSchema itemList={breadcrumbList} />}
    </>
  );
};

export default SeoHeader;
