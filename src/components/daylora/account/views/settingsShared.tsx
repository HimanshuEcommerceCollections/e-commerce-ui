"use client";

import type { ReactNode } from "react";
import { DayloraIcon } from "../../DayloraIcons";

/* ---------------------------------------------------------------------------
   Small pieces shared by the account Settings views (design 08, Settings).
   --------------------------------------------------------------------------- */

export const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

/** The per-field messages of a 400 validation answer (`data: { field: message }`). */
export function fieldErrors(e: unknown): Record<string, string> {
  const d = (e as { response?: { status?: number; data?: { data?: unknown } } })?.response;
  if (d?.status !== 400 || !d.data?.data || typeof d.data.data !== "object") return {};
  return Object.fromEntries(Object.entries(d.data.data as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<
    string,
    string
  >;
}

export { ViewHead, EmptyBox, useGoLink } from "../accountShell";

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div className="alert err" role="alert">
      <DayloraIcon name="alert" />
      <span>{children}</span>
    </div>
  );
}

/** The design's on/off switch (.sw): a real checkbox with role="switch". */
export function Switch({
  checked,
  onChange,
  labelledBy,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange?: (on: boolean) => void;
  labelledBy?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label className="sw">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        aria-checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        readOnly={!onChange}
      />
      <i />
    </label>
  );
}

/** "MM-DD" (API) → "MM/DD" (what shoppers type). */
export const birthdayIn = (v: string | null | undefined) => (v ? v.replace("-", "/") : "");
export const birthdayOk = (v: string) => {
  const m = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.exec(v);
  if (!m) return false;
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(m[1]) - 1];
  return Number(m[2]) <= days;
};
