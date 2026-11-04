"use client";

/**
 * Review your order client (PRD-032 FR-R3, FR-D3, FR-P1)
 *
 * Reads `token` once and removes it from the address bar (it lets anyone
 * holding it review the order), then `reviewLinkOrder(token)` lists the
 * order's products. Each product gets its own fields (photos go up with
 * the link token); one Submit sends every product with a rating
 * (`submitReviewsWithLink`). Products already reviewed show their review.
 * An invalid or expired link offers the account page instead.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/pages/review/index.jsx`.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";

import ReviewFields, { EMPTY_REVIEW, fieldsToInput } from "@/components/product/reviews/ReviewFields";
import StarRating from "@/components/product/reviews/StarRating";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { GET_REVIEW_LINK_ORDER, SUBMIT_REVIEWS_WITH_LINK } from "@/graphql";
import { getErrorInfo } from "@/utils/errors";
import { getReviewErrorMessage, reviewStatusLabel, reviewSubmittedMessage } from "@/utils/reviews";

// ─── Constants ────────────────────────────────────────────────────────────

const StatusEnum = {
  LOADING: "LOADING",
  READY: "READY",
  INVALID_LINK: "INVALID_LINK",
  ERROR: "ERROR",
  DONE: "DONE",
};

// ─── Component ────────────────────────────────────────────────────────────

const ReviewLinkClient = () => {
  const searchParams = useSearchParams();
  const client = useApolloClient();
  const tokenRef = useRef(null);
  const [status, setStatus] = useState(StatusEnum.LOADING);
  const [order, setOrder] = useState(null);
  const [values, setValues] = useState({});
  const [failure, setFailure] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [uploads, setUploads] = useState(0);
  const [submitReviews, { loading: submitting }] = useMutation(SUBMIT_REVIEWS_WITH_LINK);

  const load = async () => {
    const token = tokenRef.current;
    if (!token) {
      setStatus(StatusEnum.INVALID_LINK);
      return;
    }
    setStatus(StatusEnum.LOADING);
    try {
      const { data } = await client.query({
        query: GET_REVIEW_LINK_ORDER,
        variables: { token },
        fetchPolicy: "network-only",
      });
      const next = data?.reviewLinkOrder;
      setOrder(next);
      setValues(
        Object.fromEntries(
          (next?.items || [])
            .filter((item) => !item.review)
            .map((item) => [item.productId, { ...EMPTY_REVIEW, displayName: next.displayName || "" }]),
        ),
      );
      setStatus(StatusEnum.READY);
    } catch (error) {
      setStatus(getErrorInfo(error).reason === "INVALID_REVIEW_LINK" ? StatusEnum.INVALID_LINK : StatusEnum.ERROR);
    }
  };

  useEffect(() => {
    // Once per page view (also under React Strict Mode's double effect).
    if (tokenRef.current !== null) return;
    tokenRef.current = searchParams.get("token") || "";
    window.history.replaceState(null, "", "/review");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFailure("");
    const items = Object.entries(values)
      .filter(([, value]) => value.rating > 0)
      .map(([productId, value]) => ({ productId, ...fieldsToInput(value) }));
    if (items.length === 0) {
      setFailure("Give at least one product a star rating.");
      return;
    }
    try {
      const { data } = await submitReviews({ variables: { token: tokenRef.current, items } });
      const saved = data?.submitReviewsWithLink || [];
      const allLive = saved.length > 0 && saved.every((review) => String(review.status).toUpperCase() === "APPROVED");
      setDoneMessage(reviewSubmittedMessage(allLive ? "APPROVED" : "PENDING"));
      setStatus(StatusEnum.DONE);
    } catch (error) {
      if (getErrorInfo(error).reason === "INVALID_REVIEW_LINK") {
        setStatus(StatusEnum.INVALID_LINK);
        return;
      }
      setFailure(getReviewErrorMessage(error));
    }
  };

  return (
    <div className="status_section center">
      <div className="status_section_inner review_link_page" aria-live="polite" aria-busy={status === StatusEnum.LOADING}>
        {status === StatusEnum.LOADING && <h1 className="text-3xl font-bold">Loading your order…</h1>}

        {status === StatusEnum.INVALID_LINK && (
          <>
            <h1 className="text-3xl font-bold">This link has expired</h1>
            <p className="uppercase mt-2">Log in to review your purchases.</p>
            <div className="w-full mt-6">
              <GreenBoxBtn title="Log in" type="button" href="/login?next=%2Faccount%2Freviews" />
            </div>
          </>
        )}

        {status === StatusEnum.ERROR && (
          <>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="uppercase mt-2">We couldn&apos;t load your order. Please try again.</p>
            <div className="w-full mt-6">
              <GreenBoxBtn title="Try Again" type="button" onClick={load} />
            </div>
          </>
        )}

        {status === StatusEnum.DONE && (
          <>
            <h1 className="text-3xl font-bold">Thank you</h1>
            <p className="uppercase mt-2">{doneMessage}</p>
            <div className="w-full mt-8">
              <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
            </div>
          </>
        )}

        {status === StatusEnum.READY && order && (
          <form onSubmit={handleSubmit} noValidate className="review_link_form">
            <h1 className="text-3xl font-bold">How was your order{order.orderNo ? ` ${order.orderNo}` : ""}?</h1>
            <p className="mt-2">Rate the products you&apos;d like to review. Reviews are checked by the store before they appear.</p>
            {order.items.length === 0 && <p className="mt-4">There&apos;s nothing left to review in this order.</p>}
            {order.items.map((item) => (
              <div key={item.productId} className="review_link_item">
                <div className="review_link_item_head">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="review_link_image" loading="lazy" />}
                  <p className="text-base">{item.name || "Product"}</p>
                </div>
                {item.review ? (
                  <div className="review_mine">
                    <p className="text-sm uppercase">Reviewed · {reviewStatusLabel(item.review.status)}</p>
                    <StarRating rating={item.review.rating} />
                    {item.review.title && <p className="text-base">{item.review.title}</p>}
                  </div>
                ) : (
                  <ReviewFields
                    value={values[item.productId] || EMPTY_REVIEW}
                    onChange={(next) => setValues((current) => ({ ...current, [item.productId]: next }))}
                    photosEnabled={order.photosEnabled}
                    linkToken={tokenRef.current}
                    disabled={submitting}
                    idPrefix={`link-${item.productId}`}
                    onUploadingChange={(isUploading) => setUploads((count) => Math.max(0, count + (isUploading ? 1 : -1)))}
                  />
                )}
              </div>
            ))}
            {failure && <p className="input_error_msg text-sm" role="alert">{failure}</p>}
            {Object.keys(values).length > 0 && (
              <div className="w-full mt-6">
                <GreenBoxBtn title="Submit reviews" loading={submitting || uploads > 0} />
              </div>
            )}
            <p className="mt-4 text-sm">
              Have an account? <Link className="underline" href="/account/reviews">See all your reviews</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewLinkClient;
