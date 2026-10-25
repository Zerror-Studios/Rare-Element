"use client";

/**
 * Listing sort control (PRD-014 Wave 2, W2-STORE)
 *
 * A labelled native select over `LISTING_SORT_OPTIONS`; the listing owns
 * the value, the `?sort=` query and the refetch (`useListingSort`).
 */

import React from "react";

import { LISTING_SORT_OPTIONS } from "@/utils/listing-sort";

const ListingSortSelect = ({ id, value, onChange, disabled = false }) => (
  <div className="listing_sort">
    <label htmlFor={id} className="text-base">
      Sort by
    </label>
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="text-base"
    >
      {LISTING_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default ListingSortSelect;
