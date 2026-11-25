"use client";
import { createContext, useContext } from "react";
import type { CrmMember, CrmMeta } from "@/types/api/crm.types";

/** Something a dialog can be opened about: a customer or supplier the person is already looking at. */
export interface ContactRef {
  kind: "customer" | "supplier";
  id: string;
  name: string;
}

export type DialogKind = "create" | "ticket" | "task" | "lead" | "customer";

export interface OpenOptions {
  /** Who it is about. */
  about?: ContactRef;
  /** Called with the saved thing (a ticket, task, …) after it is created. */
  onDone?: (created: unknown) => void;
}

export interface CrmContextValue {
  meta: CrmMeta;
  members: CrmMember[];
  /** The signed-in admin's id. */
  me: string;
  /** Bumps after any change, so the bell and counts can reload. */
  version: number;
  changed: () => void;
  open: (kind: DialogKind, options?: OpenOptions) => void;
}

export const CrmContext = createContext<CrmContextValue | null>(null);

export function useCrm(): CrmContextValue {
  const v = useContext(CrmContext);
  if (!v) throw new Error("useCrm must be used inside the CRM layout");
  return v;
}

/** A teammate's name for an id (or "Unassigned"). */
export const memberName = (members: CrmMember[], id: string | null | undefined) => members.find((m) => m.id === id)?.name ?? "Unassigned";
