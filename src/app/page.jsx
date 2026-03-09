import dynamic from 'next/dynamic'
import SeoHeader from '@/components/seo/SeoHeader'
import Hero from '@/components/home/Hero'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { getClient } from '@/lib/apollo-client-rsc'
import { MenuData } from '@/helpers/MenuData'

// Dynamic imports for better performance
const Category = dynamic(() => import('@/components/home/Category'), { ssr: true })
const FeaturedCollection = dynamic(() => import('@/components/home/FeaturedCollection'), { ssr: true })
const GiftGuide = dynamic(() => import('@/components/home/GiftGuide'), { ssr: true })
const SocialReels = dynamic(() => import('@/components/home/SocialReels'), { ssr: true })

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Page() {
  const meta = {
    title: "Nahara – Luxury Fine Jewellery Crafted for Modern Elegance",
    description: "Discover handcrafted fine jewellery at Nahara featuring diamonds, gold, sterling silver, and contemporary designs made for modern women. Shop rings, earrings, bracelets, necklaces, and more.",
    keywords: [
      "Nahara jewellery",
      "fine jewellery India",
      "diamond jewellery online",
      "gold jewellery",
      "925 silver jewellery",
      "women's jewellery"
    ],
    primaryKeywords: ["Nahara jewellery", "fine jewellery India"],
    author: "Nahara",
    robots: "index, follow",
    og: {
      title: "Nahara – Luxury Fine Jewellery Crafted for Modern Elegance",
      description: "Handcrafted fine jewellery in gold, diamonds, and silver made for modern elegance.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Nahara – Luxury Fine Jewellery Crafted for Modern Elegance",
      description: "Explore premium handcrafted jewellery at Nahara.",
    }
  };

  let newEleganceProducts = [];
  let giftGuideProducts = [];

  try {
    const newEleganceSlug = "new-elegance";
    const giftGuideSlug = "gift-guide";
    const client = getClient();

    // Catch errors individually so missing categories don't fail the whole block
    const fetchCategory = async (slug) => {
      try {
        const res = await client.query({ query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG, variables: { slug } });
        return res?.data?.getClientSideCategory?.products || [];
      } catch (err) {
        return [];
      }
    };

    const [newEleganceRes, giftGuideRes] = await Promise.all([
      fetchCategory(newEleganceSlug),
      fetchCategory(giftGuideSlug)
    ]);

    newEleganceProducts = newEleganceRes;
    giftGuideProducts = giftGuideRes;
  } catch (error) {
    console.error("Error fetching homepage category data:", error.message);
  }

  return (
    <>
      <SeoHeader meta={meta} />
      <Hero categories={MenuData} />
      <Category data={MenuData} />
      <FeaturedCollection data={newEleganceProducts} />
      <GiftGuide data={giftGuideProducts} />
      <SocialReels />
    </>
  );
}
