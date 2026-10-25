"use client";

/**
 * Route error boundary (PRD-002 SF-14): a failed backend call shows a
 * retry instead of a cached 404.
 */

import { useEffect } from "react";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2">We couldn't load this page. Please try again.</p>
        <div className="w-full mt-8">
          <GreenBoxBtn type="button" title="Try again" onClick={() => reset()} />
        </div>
      </div>
    </div>
  );
}
