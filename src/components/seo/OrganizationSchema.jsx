import { Const } from "@/utils/Constant";
import React from "react";

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    ></script>
  );
};

export default OrganizationSchema;
