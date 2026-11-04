/**
 * Read-only star rating (PRD-032 FR-D1)
 *
 * Filled and empty Remix stars with a text label for screen readers; the
 * stars themselves are decorative.
 */

import React from "react";
import { RiStarFill, RiStarLine } from "@remixicon/react";

import { MAX_RATING, clampRating } from "@/utils/reviews";

const StarRating = ({ rating, size = 14, label }) => {
  const value = clampRating(rating);
  return (
    <span
      className="product_review_stars"
      role="img"
      aria-label={label || `Rated ${value} out of ${MAX_RATING}`}
    >
      {[...Array(MAX_RATING)].map((_, index) =>
        index < value ? (
          <RiStarFill key={index} size={size} aria-hidden="true" />
        ) : (
          <RiStarLine key={index} size={size} aria-hidden="true" />
        ),
      )}
    </span>
  );
};

export default StarRating;
