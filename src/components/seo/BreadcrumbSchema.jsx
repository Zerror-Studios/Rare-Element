import { Const } from "@/utils/Constant";

const BreadcrumbSchema = ({ itemList }) => {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@id": Const.ClientLink,
          name: "Home",
        },
      },
    ],
  };

  if (itemList && itemList.length > 0) {
    itemList.forEach((item, index) => {
      breadcrumb.itemListElement.push({
        "@type": "ListItem",
        position: index + 2,
        item: {
          "@id": Const.ClientLink + item.slug,
          name: item.name,
        },
      });
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
    ></script>
  );
};

export default BreadcrumbSchema;
