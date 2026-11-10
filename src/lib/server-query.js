/**
 * Server reads (RSC / ISR) through the kit's `zcomFetch` (PRD-002 FR-4.1):
 * the absolute gateway URL with the signed edge headers, Next's data cache,
 * and errors that throw unless they are `NOT_FOUND` (a gateway blip never
 * becomes a cached 404). Anonymous only: cached pages are shared, so no
 * shopper token or cookie is ever sent from here.
 *
 * The store's own documents (`@/graphql`) keep their exact field
 * selections, which the page components read.
 */

import { zcomFetch } from "@zcom/storefront-kit/server";

/** The catalogue pages rebuild every 5 minutes (`export const revalidate`). */
export const STORE_REVALIDATE_SECONDS = 300;

/** Runs one query; resolves its `data`. `options` as for kit `zcomFetch`. */
export async function serverQuery(query, variables, options = {}) {
  return await zcomFetch(query, variables, {
    revalidate: STORE_REVALIDATE_SECONDS,
    ...options,
  });
}
