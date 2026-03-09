import { createApolloClient } from "@/lib/apolloClient";
import { GET_PRODUCTS, GET_CLIENT_SIDE_CATEGORIES } from "@/graphql";
import { ProductStatus, Const } from "@/utils/Constant";

const EXTERNAL_DATA_URL = Const.ClientLink;

function generateSiteMap(products, categories) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${EXTERNAL_DATA_URL}/</loc>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/about</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/contact</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/privacy-policy</loc>
       <changefreq>monthly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/terms-of-service</loc>
       <changefreq>monthly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/shipping-returns</loc>
       <changefreq>monthly</changefreq>
       <priority>0.3</priority>
     </url>
     ${categories
      .map(({ slug }) => {
        if (!slug) return "";
        return `
       <url>
           <loc>${`${EXTERNAL_DATA_URL}/${slug}`}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
      })
      .join("")}
     ${products
      .map(({ slug }) => {
        if (!slug) return "";
        return `
       <url>
           <loc>${`${EXTERNAL_DATA_URL}/products/${slug}`}</loc>
           <changefreq>daily</changefreq>
           <priority>0.6</priority>
       </url>
     `;
      })
      .join("")}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  const client = createApolloClient();

  try {
    const [productRes, categoryRes] = await Promise.all([
      client.query({
        query: GET_PRODUCTS,
        variables: {
          offset: 0,
          limit: 1000,
          filters: { status: ProductStatus.PUBLISHED },
        },
      }),
      client.query({
        query: GET_CLIENT_SIDE_CATEGORIES,
        variables: {
          offset: 0,
          limit: 100,
        },
      }),
    ]);

    const products = productRes?.data?.getClientSideProducts?.products || [];
    const categories = categoryRes?.data?.getClientSideCategories?.categories || [];

    const sitemap = generateSiteMap(products, categories);

    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error("Sitemap error:", error);
    res.statusCode = 500;
    res.end();
  }

  return {
    props: {},
  };
}

export default SiteMap;
