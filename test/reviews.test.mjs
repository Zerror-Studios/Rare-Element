/**
 * Customer review helpers (PRD-032)
 *
 * The summary rows, the Product JSON-LD rating (only with approved
 * reviews), the S3 presigned POST field order (file last), photo checks,
 * status labels and the reason-based messages.
 *
 * Keep in sync with the other storefront's `test/reviews.test.mjs`.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CombinedGraphQLErrors } from "@apollo/client";

const reviews = await import("@/utils/reviews");

const graphQLError = (extensions, message = "refused") =>
  new CombinedGraphQLErrors({ errors: [{ message, extensions }] });

// ─── Summary ──────────────────────────────────────────────────────────────

describe("review summary", () => {
  const summary = { averageRating: 4.25, reviewCount: 4, distribution: [0, 0, 1, 1, 2] };

  it("formats the average and rows from 5★ down", () => {
    assert.equal(reviews.formatAverage(summary), "4.3");
    assert.equal(reviews.formatAverage({ reviewCount: 0, averageRating: 0 }), "");
    assert.deepEqual(reviews.distributionRows(summary), [
      { stars: 5, count: 2, percent: 50 },
      { stars: 4, count: 1, percent: 25 },
      { stars: 3, count: 1, percent: 25 },
      { stars: 2, count: 0, percent: 0 },
      { stars: 1, count: 0, percent: 0 },
    ]);
    assert.equal(reviews.distributionRows(null)[0].percent, 0);
  });
});

// ─── JSON-LD ──────────────────────────────────────────────────────────────

describe("buildReviewJsonLd", () => {
  it("adds nothing without approved reviews", () => {
    assert.deepEqual(reviews.buildReviewJsonLd(null, []), {});
    assert.deepEqual(reviews.buildReviewJsonLd({ reviewCount: 0, averageRating: 0 }, [{ rating: 5 }]), {});
    // The separate summary read failed: reviews alone never add a rating
    assert.deepEqual(reviews.buildReviewJsonLd(null, [{ rating: 5, comment: "Lovely" }]), {});
  });

  it("adds the rating and at most 10 reviews", () => {
    const list = Array.from({ length: 12 }, (_, index) => ({
      rating: 5,
      title: "Lovely",
      comment: `Review ${index}`,
      displayName: index ? "Asha K." : "",
      createdAt: "2026-11-01T10:00:00Z",
    }));
    const result = reviews.buildReviewJsonLd({ reviewCount: 12, averageRating: 4.96 }, list);
    assert.deepEqual(result.aggregateRating, {
      "@type": "AggregateRating",
      ratingValue: 5,
      reviewCount: 12,
      bestRating: 5,
    });
    assert.equal(result.review.length, 10);
    assert.equal(result.review[0].author.name, "Customer");
    assert.equal(result.review[1].reviewBody, "Lovely. Review 1");
    assert.equal(result.review[1].datePublished, "2026-11-01");
  });

  it("keeps the rating when the page has no review entries", () => {
    const result = reviews.buildReviewJsonLd({ reviewCount: 3, averageRating: 4 }, []);
    assert.equal(result.aggregateRating.reviewCount, 3);
    assert.equal("review" in result, false);
  });
});

// ─── Photos ───────────────────────────────────────────────────────────────

describe("review photos", () => {
  it("puts every presigned field before the file", () => {
    const file = new Blob(["x"], { type: "image/png" });
    const form = reviews.buildPresignedPostForm(
      [
        { name: "key", value: "t1/reviews/incoming/c-1/a.png" },
        { name: "Policy", value: "p" },
      ],
      file,
    );
    assert.deepEqual([...form.keys()], ["key", "Policy", "file"]);
  });

  it("refuses other types and large files", () => {
    assert.equal(reviews.validateReviewPhoto({ type: "image/jpeg", size: 1000 }), null);
    assert.match(reviews.validateReviewPhoto({ type: "image/gif", size: 1000 }), /JPEG, PNG or WebP/);
    assert.match(reviews.validateReviewPhoto({ type: "image/png", size: 6 * 1024 * 1024 }), /5 MB/);
  });
});

// ─── Status and errors ────────────────────────────────────────────────────

describe("review status and errors", () => {
  it("labels statuses and the submit result", () => {
    assert.equal(reviews.reviewStatusLabel("APPROVED"), "Live");
    assert.equal(reviews.reviewStatusLabel("rejected"), "Not published");
    assert.equal(reviews.reviewStatusLabel("PENDING"), "Pending");
    assert.equal(reviews.reviewSubmittedMessage("APPROVED"), "Your review is live.");
    assert.match(reviews.reviewSubmittedMessage("PENDING"), /once the store approves it/);
    assert.match(reviews.rejectionLabel("OFFENSIVE"), /offensive/);
    assert.match(reviews.rejectionLabel("UNKNOWN"), /guidelines/);
  });

  it("maps reasons, never message text", () => {
    assert.equal(
      reviews.getReviewErrorMessage(graphQLError({ code: "FORBIDDEN", reason: "REVIEW_NOT_ALLOWED" })),
      "Only customers who received this product can review it.",
    );
    assert.match(
      reviews.getReviewErrorMessage(graphQLError({ code: "BAD_USER_INPUT", reason: "TOO_MANY_PHOTOS" })),
      /up to 5 photos/,
    );
    assert.deepEqual(
      reviews.getReviewFieldError(
        graphQLError({ code: "BAD_USER_INPUT", reason: "INVALID_REVIEW_FIELD", field: "title" }, "Too long"),
      ),
      { field: "title", message: "Too long" },
    );
    assert.equal(reviews.getReviewFieldError(graphQLError({ code: "FORBIDDEN" })), null);
  });
});
