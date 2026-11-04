"use client";

/**
 * Review request opt-out client (PRD-032 FR-R5)
 *
 * Reads `email` and `token` once, removes them from the address bar, then
 * calls `unsubscribeReviewRequests`. The server answers `true` for any
 * email or token, so every server answer, including a GraphQL error,
 * shows the same message. Only a network failure offers a retry. Modelled
 * on `/unsubscribe` (newsletter).
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/pages/review/unsubscribe.jsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

import { UNSUBSCRIBE_REVIEW_REQUESTS } from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

// ─── Constants ────────────────────────────────────────────────────────────

const StatusEnum = {
  LOADING: "LOADING",
  DONE: "DONE",
  INVALID_LINK: "INVALID_LINK",
  NETWORK_ERROR: "NETWORK_ERROR",
};

// ─── Component ────────────────────────────────────────────────────────────

const ReviewUnsubscribeClient = () => {
  const searchParams = useSearchParams();
  const linkRef = useRef(null);
  const [status, setStatus] = useState(StatusEnum.LOADING);
  const [unsubscribe] = useMutation(UNSUBSCRIBE_REVIEW_REQUESTS);

  const run = useCallback(async () => {
    const { email, token } = linkRef.current || {};
    if (!email || !token) {
      setStatus(StatusEnum.INVALID_LINK);
      return;
    }
    setStatus(StatusEnum.LOADING);
    try {
      await unsubscribe({ variables: { email, token } });
      setStatus(StatusEnum.DONE);
    } catch (error) {
      setStatus(CombinedGraphQLErrors.is(error) ? StatusEnum.DONE : StatusEnum.NETWORK_ERROR);
    }
  }, [unsubscribe]);

  useEffect(() => {
    if (linkRef.current) return;
    linkRef.current = {
      email: (searchParams.get("email") || "").trim(),
      token: searchParams.get("token") || "",
    };
    window.history.replaceState(null, "", "/review/unsubscribe");
    run();
  }, [searchParams, run]);

  const isLoading = status === StatusEnum.LOADING;

  return (
    <div className="status_section center">
      <div className="status_section_inner" aria-live="polite" aria-busy={isLoading}>
        {isLoading && <h1 className="text-3xl font-bold">One moment…</h1>}
        {status === StatusEnum.DONE && (
          <>
            <h1 className="text-3xl font-bold">You&apos;re unsubscribed</h1>
            <p className="uppercase mt-2">You won&apos;t get review requests from us again.</p>
          </>
        )}
        {status === StatusEnum.INVALID_LINK && (
          <>
            <h1 className="text-3xl font-bold">This link is incomplete</h1>
            <p className="uppercase mt-2">Please use the link from one of our review emails.</p>
          </>
        )}
        {status === StatusEnum.NETWORK_ERROR && (
          <>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="uppercase mt-2">We couldn&apos;t reach the store. Please try again.</p>
            <div className="w-full mt-6">
              <GreenBoxBtn title="Try Again" type="button" onClick={run} />
            </div>
          </>
        )}
        {!isLoading && (
          <div className="w-full mt-8">
            <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewUnsubscribeClient;
