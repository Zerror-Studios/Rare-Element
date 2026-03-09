import { Const } from "@/utils/Constant";

const ProductSchema = ({ product }) => {
  if (!product) return null;

  const { name, description, assets, price, discountedPrice, slug, variants } = product;
  const productUrl = `${Const.ClientLink}/products/${slug}`;
  const imageUrl = assets?.[0]?.path || "";
  const currentPrice = discountedPrice > 0 ? discountedPrice : price;
  const availability = variants?.[0]?.stockStatus === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: name,
    image: [imageUrl],
    description: description,
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
      availability: availability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    ></script>
  );
};

export default ProductSchema;
