/**
 * The order status page body (backend PRD-041 FR-13, §7), rendered on the
 * server from the kit's `getOrderStatus`: the heading ("Thank you, Priya!
 * Order #NH1042 is confirmed" once paid), the timeline (Confirmed →
 * Shipped with the courier, AWB and tracking link → Delivered; or
 * Cancelled), the items, the totals, the delivery address (street masked
 * by the server), the payment status and the store's contact. Nothing
 * here comes from the browser; the sign-in hint is the only client part.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@zcom/storefront-kit/core";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import OrderStatusSignIn from "@/components/orderStatus/OrderStatusSignIn";
import { SUPPORT_EMAIL } from "@/utils/env";
import { getKitKeyMessage } from "@/utils/errors";
import { formatOrderDate, getSafeTrackingUrl } from "@/utils/order-detail";
import {
  OrderTimelineStepEnum,
  formatOrderNumber,
  getOrderTimeline,
  getPaymentStatusLabel,
  getStatusHeading,
} from "@/utils/guest-checkout";

// ─── Parts ────────────────────────────────────────────────────────────────

const Timeline = ({ status }) => {
  const steps = getOrderTimeline(status);
  const shipment = status.shipment;
  const trackingUrl = getSafeTrackingUrl(shipment?.trackingUrl);
  return (
    <ol className="order_status_timeline" aria-label="Order progress">
      {steps.map((step) => (
        <li
          key={step.key}
          className={[
            "order_status_step",
            step.done ? "is-done" : "",
            step.current ? "is-current" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-current={step.current ? "step" : undefined}
        >
          <span className="order_status_dot" aria-hidden="true" />
          <div>
            <p className="text-base uppercase">
              {step.label}
              <span className="sr-only">
                {step.done ? " (done)" : " (to come)"}
              </span>
            </p>
            {step.key === OrderTimelineStepEnum.SHIPPED &&
              step.done &&
              shipment && (
                <p className="order_status_muted text-sm">
                  {[shipment.courierName, shipment.awbCode && `AWB ${shipment.awbCode}`]
                    .filter(Boolean)
                    .join(" · ")}
                  {trackingUrl && (
                    <>
                      {" "}
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Track your parcel
                      </a>
                    </>
                  )}
                </p>
              )}
            {step.key === OrderTimelineStepEnum.DELIVERED &&
              shipment?.deliveredAt && (
                <p className="order_status_muted text-sm">
                  {formatOrderDate(shipment.deliveredAt)}
                </p>
              )}
          </div>
        </li>
      ))}
    </ol>
  );
};

const Totals = ({ status }) => {
  const money = (amount) => formatMoney(amount, status.currency);
  const rows = [
    { label: "Subtotal", value: money(status.subtotal) },
    status.discount > 0 && {
      label: "Discount",
      value: `- ${money(status.discount)}`,
    },
    {
      label: "Shipping",
      value: status.shipping > 0 ? money(status.shipping) : "Free",
    },
    status.tax > 0 && {
      label: status.pricesIncludeTax ? "Tax (included)" : "Tax",
      value: money(status.tax),
    },
  ].filter(Boolean);
  return (
    <dl className="order_status_totals">
      {rows.map((row) => (
        <div key={row.label} className="order_status_row text-sm uppercase">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
      <div className="order_status_row order_status_total text-lg uppercase">
        <dt>Total</dt>
        <dd>{money(status.total)}</dd>
      </div>
    </dl>
  );
};

// ─── View ─────────────────────────────────────────────────────────────────

const OrderStatusView = ({ status, errorKey = null }) => {
  if (!status) {
    return (
      <div className="status_section center" role="alert">
        <div className="status_section_inner">
          <h1 className="text-3xl font-bold">We couldn&apos;t load your order</h1>
          <p className="uppercase mt-2">{getKitKeyMessage(errorKey || "UNKNOWN")}</p>
          <p className="mt-4">Contact us at:</p>
          <Link className="underline block mt-1" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </Link>
          <div className="w-full mt-8">
            <GreenBoxBtn type="button" title="Continue Shopping" href="/" />
          </div>
        </div>
      </div>
    );
  }

  const address = status.shippingAddress;
  const store = status.store || {};
  const storeEmail = store.email || SUPPORT_EMAIL;
  const lines = status.lines || [];

  return (
    <section className="order_status_section">
      <div className="order_status_card">
        <p className="order_status_kicker text-sm uppercase">
          {[formatOrderNumber(status.orderNo), formatOrderDate(status.placedAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h1 className="text-3xl">{getStatusHeading(status)}</h1>

        <Timeline status={status} />

        <section aria-labelledby="order_status_items">
          <h2 id="order_status_items" className="text-lg uppercase">
            Items
          </h2>
          <ul className="order_status_lines">
            {lines.map((line, index) => (
              <li key={`line-${index}`} className="order_status_line">
                {line.imagePath ? (
                  <Image
                    className="order_status_image"
                    width={120}
                    height={160}
                    sizes="120px"
                    src={line.imagePath}
                    alt={line.name || ""}
                  />
                ) : (
                  <span className="order_status_image" aria-hidden="true" />
                )}
                <div className="order_status_line_text">
                  <p className="text-base">{line.name}</p>
                  <p className="order_status_muted text-sm">{`Qty ${line.quantity}`}</p>
                </div>
                <p className="text-base">
                  {formatMoney(line.unitPrice * line.quantity, status.currency)}
                </p>
              </li>
            ))}
          </ul>
          <Totals status={status} />
        </section>

        <div className="order_status_grid">
          {address && (
            <section aria-labelledby="order_status_address">
              <h2 id="order_status_address" className="text-lg uppercase">
                Delivery address
              </h2>
              {address.name && <p className="text-base">{address.name}</p>}
              {address.line && <p className="text-base">{address.line}</p>}
              <p className="text-base">
                {[address.city, address.state, address.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </section>
          )}
          <section aria-labelledby="order_status_payment">
            <h2 id="order_status_payment" className="text-lg uppercase">
              Payment
            </h2>
            <p className="text-base">
              {getPaymentStatusLabel(status.paymentStatus) || "—"}
            </p>
          </section>
          <section aria-labelledby="order_status_help">
            <h2 id="order_status_help" className="text-lg uppercase">
              Need help?
            </h2>
            {store.name && <p className="text-base">{store.name}</p>}
            <p className="text-base">
              <a className="underline" href={`mailto:${storeEmail}`}>
                {storeEmail}
              </a>
            </p>
            {store.phone && (
              <p className="text-base">
                <a
                  className="underline"
                  href={`tel:${store.phone.replace(/[^\d+]/g, "")}`}
                >
                  {store.phone}
                </a>
              </p>
            )}
          </section>
        </div>

        <OrderStatusSignIn />
        <div className="order_status_actions">
          <GreenBoxBtn type="button" title="Continue Shopping" href="/products" />
        </div>
      </div>
    </section>
  );
};

export default OrderStatusView;
