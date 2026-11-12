"use client";

/**
 * Order tracking card (PRD-015 FR-20, FR-18)
 *
 * Courier, AWB, "Track shipment" (the server's https `trackingUrl`) and the
 * latest scans from `shipment.tracking`. The status line is the order's
 * `trackingStatus` (ours, whatever the shipping provider; backend PRD-044)
 * in the kit's shopper wording. Nothing is shown before the shipment has
 * an AWB.
 */

import React from "react";
import { getShipmentStatusLabel } from "@zcom/storefront-kit/core";
import {
  formatOrderDate,
  getSafeTrackingUrl,
  toTrackingScans,
} from "@/utils/order-detail";

const OrderTracking = ({ shipment, trackingStatus = null }) => {
  const trackingUrl = getSafeTrackingUrl(shipment?.trackingUrl);
  const scans = toTrackingScans(shipment?.tracking);
  if (!shipment?.awb && !trackingUrl && scans.length === 0) return null;
  const statusLabel = getShipmentStatusLabel(trackingStatus);

  return (
    <section className="order_tracking" aria-labelledby="order_tracking_title">
      <p id="order_tracking_title" className="uppercase bold text-base">
        Tracking
      </p>
      {statusLabel && <p className="text-base">{`Status: ${statusLabel}`}</p>}
      {shipment?.courier && (
        <p className="text-base">{`Courier: ${shipment.courier}`}</p>
      )}
      {shipment?.awb && <p className="text-base">{`AWB: ${shipment.awb}`}</p>}
      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base underline"
        >
          Track shipment
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      {scans.length > 0 && (
        <ol className="order_tracking_scans">
          {scans.map((scan) => (
            <li key={scan.key} className="text-sm">
              <span className="bold">{scan.label}</span>
              {scan.location ? ` · ${scan.location}` : ""}
              {scan.date ? ` · ${formatOrderDate(scan.date)}` : ""}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default OrderTracking;
