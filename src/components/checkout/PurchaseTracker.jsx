"use client";

import { useEffect } from "react";
import * as fpixel from "@/lib/fpixel";

export default function PurchaseTracker() {
  useEffect(() => {
    // We could potentially pass order details here if available in local storage or via props
    fpixel.event("Purchase", {
      currency: "INR",
      // value: 0, // Ideally this should be the total order value
    });
  }, []);

  return null;
}
