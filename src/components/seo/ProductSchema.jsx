import { Const } from "@/utils/Constant";
import { htmlToPlainText } from "@/utils/sanitize-html";
import { toProductOffers } from "@/utils/product-offers";
import { toJsonLd } from "@/utils/json-ld";

// PRD-014 FR-2.8 (UX-33): offers from `utils/product-offers` (no
// `availability`: storefronts have no stock signal yet, PRD-020).
const ProductSchema = ({ product }) => {
  if (!product) return null;

  const { name, description, assets, slug, variants } = product;
  const productUrl = `${Const.ClientLink}/products/${slug}`;
  const images = (assets || []).map((asset) => asset?.path).filter(Boolean);
  const offers = toProductOffers(variants, productUrl);

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: name,
    ...(images.length ? { image: images.slice(0, 5) } : {}),
    description: htmlToPlainText(description),
    sku: variants?.[0]?.sku || slug,
    brand: {
      "@type": "Brand",
      name: Const.Brand,
    },
    ...(offers ? { offers } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    ></script>
  );
};

export default ProductSchema;
