import { toJsonLd } from "@/utils/json-ld";

const WebPageSchema = ({ name, description, url }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: name,
    description: description,
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: ["//title", "//meta[@name='description']/@content"],
    },
    url: url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(schemaData) }}
    ></script>
  );
};

export default WebPageSchema;
