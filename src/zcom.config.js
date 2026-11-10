/**
 * The store facts the kit needs before any API call (PRD-002 FR-4.1): the
 * backend has no public store-info query, so they live here.
 */

import { defineZcomConfig } from "@zcom/storefront-kit/core";

import { SITE_URL } from "@/utils/env";
import { REASON_MESSAGES } from "@/utils/errors";

export const zcomConfig = defineZcomConfig({
  storeName: "Nahara",
  siteUrl: SITE_URL,
  logoUrl: `${SITE_URL}/logo.svg`,
  defaultCurrency: "INR",
  locale: "en-IN",
  itemIdFrom: "variantId",
  socialLinks: ["https://www.instagram.com/nahara.jewellery/"],
  // The store's own copy for error reasons (kit messages fill the rest)
  errorMessages: REASON_MESSAGES,
});
