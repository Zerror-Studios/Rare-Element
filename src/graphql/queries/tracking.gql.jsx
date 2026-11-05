import { gql } from "@apollo/client";

// PRD-034 FR-1.2: the store's public tag ids (public, edge-cached; read
// once on the server in `lib/tracking-config.js`). Null = not set up.
export const STOREFRONT_TRACKING_CONFIG = gql`
  query StorefrontTrackingConfig {
    storefrontTrackingConfig {
      ga4MeasurementId
      metaPixelId
      googleAds {
        conversionId
        purchaseLabel
        addToCartLabel
        beginCheckoutLabel
        enhancedConversions
      }
    }
  }
`;
