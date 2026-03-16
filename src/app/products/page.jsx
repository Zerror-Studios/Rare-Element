import { Suspense } from 'react';
import ProductsData from './products-data';
import AllProductsPageSkeleton from '@/components/skeletons/AllProductsPageSkeleton';

export const revalidate = 300;

export const metadata = {
  title: "Shop by Category – Fine Jewellery by Nahara",
  description: "Browse jewellery categories including rings, earrings, necklaces, bracelets, and anklets crafted with gold, diamonds, and silver.",
  keywords: [
    "jewellery categories",
    "rings earrings necklaces",
    "Nahara jewellery"
  ],
};

export default function Page() {
  return (
    <Suspense fallback={<AllProductsPageSkeleton />}>
      <ProductsData />
    </Suspense>
  )
}
