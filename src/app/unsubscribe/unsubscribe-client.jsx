"use client";

/**
 * Newsletter unsubscribe client (PRD-002 VCON-1)
 *
 * Reads `email` and `token` once, removes them from the address bar (so
 * they don't linger in history or analytics page URLs), then calls
 * `unsubscribeNewsletter`. The server answers `true` for any email or token
 * (no subscription is revealed), so every server answer, including a
 * GraphQL error, shows the same neutral message. Only a network failure
 * offers a retry.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/pages/unsubscribe/index.jsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { UNSUBSCRIBE_NEWSLETTER } from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { SUPPORT_EMAIL } from "@/utils/env";

// ─── Constants ────────────────────────────────────────────────────────────

const StatusEnum = {
  LOADING: "LOADING",
  DONE: "DONE",
  INVALID_LINK: "INVALID_LINK",
  NETWORK_ERROR: "NETWORK_ERROR",
};

// ─── Component ────────────────────────────────────────────────────────────

const UnsubscribeClient = () => {
  const searchParams = useSearchParams();
  const linkRef = useRef(null);
  const [status, setStatus] = useState(StatusEnum.LOADING);
  const [unsubscribe] = useMutation(UNSUBSCRIBE_NEWSLETTER);

  const run = useCallback(async () => {
    const { email, token } = linkRef.current || {};
    if (!email) {
      setStatus(StatusEnum.INVALID_LINK);
      return;
    }
    setStatus(StatusEnum.LOADING);
    try {
      await unsubscribe({ variables: { email, token: token || null } });
      setStatus(StatusEnum.DONE);
    } catch (error) {
      setStatus(
        CombinedGraphQLErrors.is(error)
          ? StatusEnum.DONE
          : StatusEnum.NETWORK_ERROR,
      );
    }
  }, [unsubscribe]);

  useEffect(() => {
    // Once per page view (also under React Strict Mode's double effect).
    if (linkRef.current) return;
    linkRef.current = {
      email: (searchParams.get("email") || "").trim(),
      token: searchParams.get("token") || "",
    };
    window.history.replaceState(null, "", "/unsubscribe");
    run();
  }, [searchParams, run]);

  const isLoading = status === StatusEnum.LOADING;

  return (
    <div className="status_section center">
      <div className="status_section_inner" aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <>
            <h1 className="text-3xl font-bold">Unsubscribing…</h1>
            <p className="uppercase mt-2">This will only take a moment.</p>
          </>
        )}
        {status === StatusEnum.DONE && (
          <>
            <h1 className="text-3xl font-bold">You&apos;ve been unsubscribed</h1>
            <p className="uppercase mt-2">
              You won&apos;t receive our newsletter at this address any more.
            </p>
          </>
        )}
        {status === StatusEnum.INVALID_LINK && (
          <>
            <h1 className="text-3xl font-bold">This link is incomplete</h1>
            <p className="uppercase mt-2">
              Please use the unsubscribe link from one of our emails.
            </p>
          </>
        )}
        {status === StatusEnum.NETWORK_ERROR && (
          <>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="uppercase mt-2">
              We couldn&apos;t reach the store. Please check your connection and
              try again.
            </p>
            <div className="w-full mt-6">
              <GreenBoxBtn title="Try Again" type="button" onClick={run} />
            </div>
          </>
        )}
        {!isLoading && (
          <>
            <p className="mt-4">Have Question? Contact Us at: </p>
            <Link
              className="underline text-blue-600 block mt-1"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </Link>
            <div className="w-full mt-8">
              <GreenBoxBtn title="Continue Shopping" type="button" href="/" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UnsubscribeClient;
