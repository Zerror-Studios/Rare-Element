import { Const } from "@/utils/Constant";
import { htmlToPlainText } from "@/utils/sanitize-html";
import { toProductOffers } from "@/utils/product-offers";
import { toJsonLd } from "@/utils/json-ld";
import { buildReviewJsonLd } from "@/utils/reviews";

// PRD-014 FR-2.8 (UX-33): offers from `utils/product-offers`, with
// `availability` from the product rollup when the store has the stock
// signal on (PRD-020 FR-14; `null` leaves it out). PRD-032 FR-D1: the
// rating and the reviews shown on the page, only when the separate
// summary read succeeded with approved reviews.
const ProductSchema = ({ product, reviews = [], reviewSummary = null }) => {
  if (!product) return null;

  const { name, description, assets, slug, variants, availability } = product;
  const productUrl = `${Const.ClientLink}/products/${slug}`;
  const images = (assets || []).map((asset) => asset?.path).filter(Boolean);
  const offers = toProductOffers(variants, productUrl, availability);

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
    ...buildReviewJsonLd(reviewSummary, reviews),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
    ></script>
  );
};

export default ProductSchema;
