"use client";

/**
 * Back-in-stock confirmation client (PRD-020, child-PRD review CP-22)
 *
 * Reads `token` once, removes it from the address bar (so it doesn't
 * linger in history or analytics page URLs), then calls
 * `confirmBackInStock`. `true` confirms every pending alert of the
 * address (CP2-03); `false` or any other server error means the link is
 * unknown, used, replaced or expired; `RATE_LIMITED`
 * (by `extensions.reason`) and network failures offer a retry.
 *
 * Keep in sync with
 * `storefronts/deveshe-dreams/src/pages/back-in-stock/confirm.jsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CONFIRM_BACK_IN_STOCK } from "@/graphql";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import {
  BACK_IN_STOCK_CONFIRM_PATH,
  backInStockConfirmStatusEnum as StatusEnum,
  getConfirmStatusFromAnswer,
  getConfirmStatusFromError,
  readConfirmToken,
} from "@/utils/back-in-stock";

// ─── Component ────────────────────────────────────────────────────────────

const ConfirmClient = () => {
  const searchParams = useSearchParams();
  const tokenRef = useRef(null);
  const [status, setStatus] = useState(StatusEnum.LOADING);
  const [confirm] = useMutation(CONFIRM_BACK_IN_STOCK);

  const run = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      setStatus(StatusEnum.INVALID_LINK);
      return;
    }
    setStatus(StatusEnum.LOADING);
    try {
      const { data } = await confirm({ variables: { token } });
      setStatus(getConfirmStatusFromAnswer(data?.confirmBackInStock));
    } catch (error) {
      setStatus(getConfirmStatusFromError(error));
    }
  }, [confirm]);

  useEffect(() => {
    // Once per page view (also under React Strict Mode's double effect).
    if (tokenRef.current !== null) return;
    tokenRef.current = readConfirmToken(searchParams.get("token"));
    window.history.replaceState(null, "", BACK_IN_STOCK_CONFIRM_PATH);
    run();
  }, [searchParams, run]);

  const isLoading = status === StatusEnum.LOADING;
  const canRetry =
    status === StatusEnum.RATE_LIMITED || status === StatusEnum.NETWORK_ERROR;

  return (
    <div className="status_section center">
      <div className="status_section_inner" aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <>
            <h1 className="text-3xl font-bold">Confirming your alert…</h1>
            <p className="uppercase mt-2">This will only take a moment.</p>
          </>
        )}
        {status === StatusEnum.CONFIRMED && (
          <>
            <h1 className="text-3xl font-bold">You&apos;re on the list</h1>
            <p className="uppercase mt-2">
              We&apos;ll email you when the items you asked about are back in
              stock.
            </p>
          </>
        )}
        {status === StatusEnum.INVALID_LINK && (
          <>
            <h1 className="text-3xl font-bold">This link has expired</h1>
            <p className="uppercase mt-2">
              It may have been used already, or a newer email replaced it.
              Use the newest link we sent, or tap &quot;Notify me&quot; again
              tomorrow for a new one.
            </p>
          </>
        )}
        {status === StatusEnum.RATE_LIMITED && (
          <>
            <h1 className="text-3xl font-bold">Please try again later</h1>
            <p className="uppercase mt-2">
              We&apos;ve had a lot of requests. Please try again in a little
              while.
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
          </>
        )}
        {canRetry && (
          <div className="w-full mt-6">
            <GreenBoxBtn title="Try Again" type="button" onClick={run} />
          </div>
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

export default ConfirmClient;
