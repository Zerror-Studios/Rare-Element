import React from "react";
import { Const } from "@/utils/Constant";
import { MenuData } from "@/helpers/MenuData";
import { toJsonLd } from "@/utils/json-ld";

const SiteNavigationSchema = () => {
  const schemaData = MenuData.flatMap((menu) => {
    const items = [
      {
        "@context": "https://schema.org",
        "@type": "SiteNavigationElement",
        name: menu.name,
        url: `${Const.ClientLink}${menu.path}`,
      },
    ];

    if (menu.subItems && Array.isArray(menu.subItems)) {
      menu.subItems.forEach((sub) => {
        if (sub.name !== "All") {
          items.push({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            name: sub.name,
            url: `${Const.ClientLink}${sub.path}`,
          });
        }
      });
    }

    return items;
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schemaData) }}
    ></script>
  );
};

export default SiteNavigationSchema;
