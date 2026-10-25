import { Const } from "@/utils/Constant";
import { getMinVariantPrice } from "@/utils/Util";
import { htmlToPlainText } from "@/utils/sanitize-html";
import { toJsonLd } from "@/utils/json-ld";

const ProductSchema = ({ product }) => {
  if (!product) return null;

  const { name, description, assets, slug, variants } = product;
  const productUrl = `${Const.ClientLink}/products/${slug}`;
  const imageUrl = assets?.[0]?.path || "";
  const currentPrice = getMinVariantPrice(variants);

  // Stock levels aren't exposed to storefronts, so `availability` is
  // omitted rather than guessed.
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: name,
    image: [imageUrl],
    description: htmlToPlainText(description),
    sku: variants?.[0]?.sku || slug,
    brand: {
      "@type": "Brand",
      name: Const.Brand,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: currentPrice,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    ></script>
  );
};

export default ProductSchema;
