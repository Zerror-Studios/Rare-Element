"use client";

/**
 * Keyboard behaviour for drawers and menus (PRD-014 UX-31)
 *
 * While `isOpen`: focus moves into the container, Tab and Shift+Tab stay
 * inside it, Escape calls `onClose`, and focus returns to the opener on
 * close. While closed, the container is `inert`, so its off-screen links
 * and buttons leave the tab order and the accessibility tree.
 *
 * The container needs `tabIndex={-1}` (the focus target when it holds no
 * focusable element) plus `role="dialog"` and `aria-modal="true"`.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/hooks/useDialogA11y.jsx`.
 */

import { useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// ─── Helpers ──────────────────────────────────────────────────────────────

const getFocusable = (container) =>
  Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  );

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useDialogA11y(containerRef, isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    containerRef.current?.toggleAttribute("inert", !isOpen);
  }, [containerRef, isOpen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return undefined;

    const opener = document.activeElement;
    (getFocusable(container)[0] || container).focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = getFocusable(container);
      if (!items.length) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!container.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [containerRef, isOpen]);
}
