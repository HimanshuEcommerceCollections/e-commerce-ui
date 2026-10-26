"use client";

import React, { useState } from "react";
import { useSavedItems } from "@/hooks/useSavedItems";

/**
 * Saved-items heart (cards and PDP). The hook keeps the saved ids for guests
 * and customers alike; this only reflects and toggles one SKU.
 */
export function SaveHeart({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const saved = useSavedItems();
  const [busy, setBusy] = useState(false);
  const on = saved.isSaved(productId);
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || !saved.ready) return;
    setBusy(true);
    try {
      await saved.toggle(productId);
    } catch {
      /* the hook reports its own errors; the heart just stays as it was */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className={`save-heart${on ? " on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from saved items` : `Save ${name}`}
      aria-busy={busy}
      disabled={!saved.ready}
      onClick={toggle}
    >
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
