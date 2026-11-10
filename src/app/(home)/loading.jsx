/**
 * The home page's skeleton. It lives in the `(home)` route group (same URL,
 * `/`) so it wraps only the home page: as the root `loading.jsx` it wrapped
 * every route, which made each page stream, so a product page's
 * `notFound()` answered 200 and its id → slug redirect couldn't be a 308
 * (SF-14; found by the kit's live check, 2026-11-11).
 */

import HomePageSkeleton from "@/components/skeletons/HomePageSkeleton";

export default function Loading() {
  return <HomePageSkeleton />;
}