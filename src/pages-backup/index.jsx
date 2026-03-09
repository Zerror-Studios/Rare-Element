import dynamic from 'next/dynamic'
import SeoHeader from '@/components/seo/SeoHeader'
import Hero from '@/components/home/Hero'
import { GET_CLIENT_SIDE_CATEGORY_BY_SLUG } from '@/graphql'
import { createApolloClient } from '@/lib/apolloClient'
import { MenuData } from '@/helpers/MenuData'

// Dynamic imports for better performance
const Category = dynamic(() => import('@/components/home/Category'), { ssr: true })
const FeaturedCollection = dynamic(() => import('@/components/home/FeaturedCollection'), { ssr: true })
const GiftGuide = dynamic(() => import('@/components/home/GiftGuide'), { ssr: true })
const SocialReels = dynamic(() => import('@/components/home/SocialReels'), { ssr: false })

const Home = ({ meta, newEleganceProducts, giftGuideProducts }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <Hero categories={MenuData} />
      <Category data={MenuData} />
      <FeaturedCollection data={newEleganceProducts} />
      <GiftGuide data={giftGuideProducts} />
      <SocialReels />
    </>
  )
}

export default Home

export async function getStaticProps() {
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

  try {
    const newEleganceSlug = "new-elegance";
    const giftGuideSlug = "gift-guide";
    const client = createApolloClient();
    const [newEleganceResponse, giftGuideResponse] = await Promise.all([
      client.query({ query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG, variables: { slug: newEleganceSlug } }),
      client.query({ query: GET_CLIENT_SIDE_CATEGORY_BY_SLUG, variables: { slug: giftGuideSlug } })
    ]);
    const { products: newEleganceProducts } = newEleganceResponse?.data?.getClientSideCategory;
    const { products: giftGuideProducts } = giftGuideResponse?.data?.getClientSideCategory;
    return {
      props: {
        meta: meta,
        newEleganceProducts: newEleganceProducts || [],
        giftGuideProducts: giftGuideProducts || [],
        initialApolloState: client.cache.extract(),
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return {
      props: {
        meta,
        newEleganceProducts: [],
        giftGuideProducts: [],
      },
      revalidate: 60,
    };
  }
}