import React from "react";
import { Const } from "@/utils/Constant";
import { MenuData } from "@/helpers/MenuData";
import { toJsonLd } from "@/utils/json-ld";

// PRD-014 FR-2.8 (UX-33): MenuData items are `{ title, link }`; reading
// `name`/`path` produced "…undefined" URLs. Items without both are skipped.
const NAVIGATION_ITEMS = [{ title: "All", link: "/products" }, ...MenuData];

const SiteNavigationSchema = () => {
  const schemaData = NAVIGATION_ITEMS.filter(
    (menu) => menu?.title && menu?.link,
  ).map((menu) => ({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: menu.title,
    url: `${Const.ClientLink}${menu.link}`,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schemaData) }}
    ></script>
  );
};

export default SiteNavigationSchema;
