"use client";

/**
 * Star picker (PRD-032 FR-D2)
 *
 * Five radio inputs in a fieldset, so the arrow keys move between stars
 * and each star is announced as "N out of 5 stars". The visible star is
 * the label; the radio itself is visually hidden.
 */

import React, { useId } from "react";
import { RiStarFill, RiStarLine } from "@remixicon/react";

import { MAX_RATING } from "@/utils/reviews";

const StarPicker = ({ value = 0, onChange, legend = "Your rating", error, disabled = false }) => {
  const name = useId();
  return (
    <fieldset className="review_star_picker" disabled={disabled}>
      <legend className="text-sm">{legend}</legend>
      <div className="review_star_picker_row">
        {[...Array(MAX_RATING)].map((_, index) => {
          const stars = index + 1;
          const id = `${name}-${stars}`;
          return (
            <label key={stars} htmlFor={id} className="review_star_picker_star">
              <input
                id={id}
                type="radio"
                name={name}
                value={stars}
                checked={value === stars}
                onChange={() => onChange?.(stars)}
                aria-label={`${stars} out of ${MAX_RATING} stars`}
                className="visually_hidden"
              />
              {stars <= value ? (
                <RiStarFill size={24} aria-hidden="true" />
              ) : (
                <RiStarLine size={24} aria-hidden="true" />
              )}
            </label>
          );
        })}
      </div>
      {error && <p className="input_error_msg text-xs">{error}</p>}
    </fieldset>
  );
};

export default StarPicker;
