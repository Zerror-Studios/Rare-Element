# PRD-032 — Customer reviews (pointer)

| Field | Value |
|---|---|
| Status | **Implemented** 2026-11-04 (this repo's FR-D1–FR-D5, FR-R3/R5 pages, FR-P upload); not browser-tested or run against a live gateway or S3 |
| Source-of-truth PRD | [`../../../../zcom-backend/docs/prd/PRD-032-customer-reviews.md`](../../../../zcom-backend/docs/prd/PRD-032-customer-reviews.md) |
| Approved by / on | Anand (owner), 2026-11-04: recommended answers, except Q2 (b) shopper photos in this build |

## UX in this storefront

- **Product page** (`components/product/ProductReviews.jsx`): the rating summary from `Product.reviewSummary` (average, stars, count, and 5★…1★ bars; each bar filters by that rating), "With photos", "Sort by" (Newest, Highest rated, Lowest rated) and "Load more" (10 per page). The first page is read with the page (ISR, 5 minutes); every filter, sort or page after it reads `getReviews` from the browser, and a slower old answer never replaces a newer one. Each review: stars, title, comment (text, never HTML), photos (thumbnails, a viewer dialog with `useDialogA11y`), "Name · Verified buyer · variant · date", the store's reply, and "Report" (Spam, Offensive, Not a genuine review, Something else → `reportReview`; always "Thanks, we'll take a look.").
- **Write a review** (`components/product/reviews/ReviewComposer.jsx`): logged out → "Log in to write a review" (`/login?next=<product>#write-review`). Logged in: hidden when `storefrontReviewSettings.enabled` is false; otherwise the form (`ReviewFields.jsx`: a radio star picker, "N out of 5 stars"; title ≤ 120; comment ≤ 5000 with a counter; the display name, empty to let the server use "First L."; photos when `photosEnabled`, ≤ 5, JPEG/PNG/WebP ≤ 5 MB). A shopper's existing review (from `myReviews`, 100 scanned) shows with its status, Edit (prefilled; kept photos go back as `keepPhotoKeys`) and Delete (`deleteMyReview`). After a submit the answer's status picks "Your review is live." or "Thanks! Your review will appear once the store approves it." Refusals by `extensions.reason` (`utils/reviews.js`): `REVIEW_NOT_ALLOWED`, `REVIEWS_DISABLED`, `RATE_LIMITED`, `INVALID_REVIEW_FIELD` (on its field), `INVALID_PHOTO`, `FILE_TOO_LARGE`, `TOO_MANY_PHOTOS`. The section opens itself for `#write-review`.
- **Photos** (`hooks/useReviewPhotoUpload.jsx`): `requestReviewPhotoUpload` → the browser POSTs the file to S3 (`presignedPost.url`, every field first, the file last; the one non-gateway call, as the presigned-upload exception allows) → `confirmReviewPhoto` returns the `receipt` sent with the review and the URL shown. A review-link page passes the link token to both.
- **`/review?token=`** (`app/review/`, noindex, `no-referrer`, robots-disallowed): reads the token once and drops it from the address bar, lists the order's products (`reviewLinkOrder`), one set of fields per product not yet reviewed (reviewed ones show their review and status) and one Submit (`submitReviewsWithLink`, products with a rating only). `INVALID_REVIEW_LINK` → "This link has expired. Log in to review your purchases."
- **`/review/unsubscribe?email=&token=`**: `unsubscribeReviewRequests`, the same uniform answer as `/unsubscribe`: "You won't get review requests from us again."
- **Account › Reviews** (`app/account/reviews/`, nav link in `AccountAside`): "Review your purchases" (`myReviewableProducts`, each a link to its product page's form) and "My reviews" (`myReviews`: Live / Pending / Not published with the reason in plain words; Edit → the product page, Delete). Order detail: "Write a review" on each line of a DELIVERED or PARTIALLY_REFUNDED order.
- **Rating summary read on its own** (coordinator fix, 2026-11-04): `GetProductReviewSummary` (`getClientSideProductById(id) { _id reviewSummary {…} }`) is a separate server read in `product-data.jsx`; `reviewSummary` is **not** in `GetClientSideProductById`, so the edge-cached catalog query never depends on the commerce subgraph. Any failure of the summary read means no summary (the block is left out, the reviews read with the page still show), never a broken page.
- **JSON-LD**: `components/seo/ProductSchema.jsx` adds `aggregateRating` and up to 10 `review` entries (the reviews read with the page) only when that separate summary read succeeded with `reviewCount > 0` (`buildReviewJsonLd`).

## Decisions here

- **Q10 (stars on listing cards): not added.** The card shows only the image, name and price in this jewellery design, and the listing query is ISR-cached for every category; adding `reviewSummary` there buys little next to the product page's summary. Revisit with the design owner.
- Review photos render with a plain `<img>`, not `next/image`: their host is the store's media CDN or S3 bucket, which isn't in `images.remotePatterns` (adding hosts needs approval).
- CSP (`next.config.mjs`): `https://*.amazonaws.com` added to `connect-src` (the S3 upload) and `img-src` (photos served straight from S3 when the store has no CDN).

## Owner steps

- **S3 CORS:** the media bucket needs a CORS rule allowing `POST` from this storefront's origin (`https://nahara.co.in`, plus any preview origin), or every photo upload fails in the browser.
- Deploy the backend (with `REVIEW_LINK_SECRET`) before this storefront; turn the review-request job on (`REVIEW_REQUESTS_ENABLED`) only after `/review` is live here and on deveshe.

## Implementation log

| Date | Entry |
|---|---|
| 2026-11-04 | Built: `src/graphql/queries/review.gql.jsx` (GetProductReviews with `sort`, GetMyReviews, GetMyReviewableProducts, GetReviewLinkOrder, GetStorefrontReviewSettings), `src/graphql/mutations/review.mutation.jsx` (SubmitReview, SubmitReviewsWithLink, DeleteMyReview, ReportReview, UnsubscribeReviewRequests, RequestReviewPhotoUpload, ConfirmReviewPhoto), GetProductReviewSummary (its own read; `reviewSummary` kept out of GetClientSideProductById), `src/utils/reviews.js`, `src/hooks/useReviewPhotoUpload.jsx`, `src/components/product/ProductReviews.jsx` (rewritten), `src/components/product/reviews/{StarRating,StarPicker,ReviewFields,ReviewComposer}.jsx`, `src/components/seo/{ProductSchema,SeoHeader}.jsx`, `src/app/products/[slug]/{product-client,product-data}.jsx`, `src/app/review/{page,loading,review-link-client}.jsx`, `src/app/review/unsubscribe/{page,unsubscribe-client}.jsx`, `src/app/account/reviews/{page,loading,reviews-client}.jsx`, `src/components/account/AccountAside.jsx`, `src/app/account/order/[id]/order-detail-client.jsx`, `src/app/robots.js` (`/review`), `next.config.mjs` (CSP), styles in `productDetail.css` and `globals.css` (`.visually_hidden`); `test/reviews.test.mjs` (8). `npm test` 93/93 (was 85); `validate:ops` 60/60, 0 failures; `next build` passes with placeholder env. Not run in a browser. |
