"use client";

/**
 * Shopper cancel (PRD-015 FR-11, FR-20)
 *
 * Shown only when the server says `canCancel`. "Cancel order" opens an
 * inline confirmation (refunds go back to the original payment method);
 * `cancelMyOrder` re-checks every rule, and its reasons are mapped in
 * `utils/errors.js`.
 */

import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { CANCEL_MY_ORDER } from "@/graphql";
import { getErrorMessage } from "@/utils/errors";
import {
  CANCEL_CONFIRM_MESSAGE,
  CANCEL_REASON_MAX_LENGTH,
  toCancelReason,
} from "@/utils/order-detail";

const OrderCancel = ({ orderId, onChanged }) => {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const confirmRef = useRef(null);
  const [cancelOrder, { loading }] = useMutation(CANCEL_MY_ORDER);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const handleConfirm = async () => {
    setError("");
    try {
      await cancelOrder({
        variables: { orderId, reason: toCancelReason(reason) },
      });
      toast.success("Your order was cancelled.");
      setConfirming(false);
      await onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't cancel this order."));
    }
  };

  if (!confirming) {
    return (
      <div className="order_actions">
        <button
          type="button"
          className="cancel_form_btn order_action_btn"
          onClick={() => setConfirming(true)}
        >
          Cancel order
        </button>
      </div>
    );
  }

  return (
    <div
      ref={confirmRef}
      className="order_confirm"
      role="alertdialog"
      aria-labelledby="order_cancel_title"
      aria-describedby="order_cancel_text"
      tabIndex={-1}
    >
      <p id="order_cancel_title" className="uppercase bold text-base">
        Cancel this order
      </p>
      <p id="order_cancel_text" className="text-base">
        {CANCEL_CONFIRM_MESSAGE}
      </p>
      <div className="inp_paren">
        <label htmlFor="order_cancel_reason" className="text-sm">
          Reason (optional)
        </label>
        <textarea
          id="order_cancel_reason"
          className="settings_input order_textarea"
          maxLength={CANCEL_REASON_MAX_LENGTH}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {error && (
        <p className="input_error_msg" role="alert">
          {error}
        </p>
      )}
      <div className="order_actions">
        <button
          type="button"
          className="submit_form_btn order_action_btn"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Cancelling…" : "Yes, cancel order"}
        </button>
        <button
          type="button"
          className="cancel_form_btn order_action_btn"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Keep order
        </button>
      </div>
    </div>
  );
};

export default OrderCancel;
