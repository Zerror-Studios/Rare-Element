import { Const } from "@/utils/Constant";
import React from "react";
import { toJsonLd } from "@/utils/json-ld";

const OrganizationSchema = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: Const.Brand,
    logo: {
      "@type": "ImageObject",
      url: `${Const.ClientLink}/favicon.ico`,
      width: "1800px",
      height: "900px",
    },
    url: Const.ClientLink,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schemaData) }}
    ></script>
  );
};

export default OrganizationSchema;
