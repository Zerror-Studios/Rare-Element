import { Suspense } from "react";
import ProductData from "./product-data";
import ProductDetailPageSkeleton from "@/components/skeletons/ProductDetailPageSkeleton";

export const revalidate = 300;

export default async function Page({ params }) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailPageSkeleton />}>
      <ProductData slug={slug} />
    </Suspense>
  );
}