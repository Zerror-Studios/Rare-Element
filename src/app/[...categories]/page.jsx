import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { getClient } from '@/lib/apollo-client-rsc'
import CategoryClient from './category-client'
import { notFound } from 'next/navigation'

export const revalidate = 300;

const defaultMeta = {
  title: "Shop by Category – Fine Jewellery by Nahara",
  description: "Browse jewellery categories including rings, earrings, necklaces, bracelets, and anklets crafted with gold, diamonds, and silver.",
  keywords: [
    "jewellery categories",
    "rings earrings necklaces",
    "Nahara jewellery"
  ],
  robots: "index, follow",
};

export async function generateMetadata({ params }) {
  const { categories } = await params;
  const slug = categories[categories.length - 1];

  try {
    const client = getClient();
    const response = await client.query({
      query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG,
      variables: { slug, limit: 1, offset: 0 }
    });

    const category = response?.data?.getClientSideCategory;
    const meta = category?.meta;

    return {
      title: meta?.title || `${category?.name} | Nahara Jewellery` || defaultMeta.title,
      description: meta?.description || category?.description || defaultMeta.description,
      keywords: meta?.keywords || defaultMeta.keywords,
      robots: meta?.robots || defaultMeta.robots,
    };
  } catch (error) {
    return defaultMeta;
  }
}

export default async function Page({ params }) {
  const { categories } = await params;
  const slug = categories[categories.length - 1];

  try {
    const client = getClient();
    const response = await client.query({
      query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG,
      variables: {
        slug,
        limit: 12,
        offset: 0
      }
    });

    if (!response?.data?.getClientSideCategory) {
      notFound();
    }

    const { _id, name, description, imgsrc, slug: categoriesSlug, meta: categoriesMeta, products, productsCount } = response?.data?.getClientSideCategory;

    return (
      <CategoryClient
        meta={categoriesMeta || defaultMeta}
        data={{ _id, name, description, imgsrc, categoriesSlug }}
        initialProducts={products || []}
        initialTotalCount={productsCount || 0}
      />
    );
  } catch (error) {
    console.error("Error fetching category data:", error.message);
    notFound();
  }
}

