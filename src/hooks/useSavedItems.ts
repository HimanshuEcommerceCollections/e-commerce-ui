"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";
import savedItemsService from "@/services/account/savedItems.service";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Saved items ("hearts", API contract C5), shared by every heart on the page.
 *
 * Signed-in customers save to the server. Guests save in this browser
 * (localStorage `ec-saved-v1`, a list of product ids); those hearts are merged
 * into the account (POST /saved-items/merge) the first time the shopper is
 * signed in, then cleared locally.
 */

const KEY = "ec-saved-v1";

function readLocal(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    // Older prototype entries were objects with a product id or slug.
    return Array.isArray(v)
      ? v.map((x) => (typeof x === "string" ? x : x?.productId)).filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: hearts last for this page view only */
  }
}

interface SavedState {
  ids: Set<string>;
  ready: boolean;
  /** Whose hearts `ids` holds: a user id, or "guest". */
  owner: string | null;
  sync: (owner: string, customer: boolean) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  /** For views that change the list themselves (e.g. move to cart). */
  drop: (productId: string) => void;
}

let customerMode = false;

export const useSavedItemsStore = create<SavedState>()((set, get) => ({
  ids: new Set(),
  ready: false,
  owner: null,

  sync: async (owner, customer) => {
    if (get().owner === owner) return;
    customerMode = customer;
    set({ owner, ready: false });
    if (!customer) {
      set({ ids: new Set(readLocal()), ready: true });
      return;
    }
    try {
      const guest = readLocal();
      const res = guest.length ? await savedItemsService.merge(guest) : await savedItemsService.ids();
      if (guest.length) writeLocal([]);
      if (get().owner === owner) set({ ids: new Set(res.data.data ?? []), ready: true });
    } catch {
      // Hearts just show as empty; the next sign-in or reload tries again.
      if (get().owner === owner) set({ ids: new Set(), ready: true });
    }
  },

  toggle: async (productId) => {
    const before = get().ids;
    const saved = before.has(productId);
    const next = new Set(before);
    if (saved) next.delete(productId);
    else next.add(productId);
    set({ ids: next });
    if (!customerMode) {
      writeLocal(Array.from(next));
      return;
    }
    try {
      if (saved) await savedItemsService.remove(productId);
      else await savedItemsService.save(productId);
    } catch (e) {
      set({ ids: before });
      throw e;
    }
  },

  drop: (productId) => {
    const next = new Set(get().ids);
    next.delete(productId);
    set({ ids: next });
  },
}));

export function useSavedItems(): {
  ids: Set<string>;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  ready: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const ids = useSavedItemsStore((s) => s.ids);
  const ready = useSavedItemsStore((s) => s.ready);
  const toggle = useSavedItemsStore((s) => s.toggle);
  const sync = useSavedItemsStore((s) => s.sync);

  const customer = user?.role === "ROLE_CUSTOMER";
  const owner = customer ? `u:${user?.email ?? ""}` : "guest";
  useEffect(() => {
    void sync(owner, customer);
  }, [owner, customer, sync]);

  const isSaved = useCallback((productId: string) => ids.has(productId), [ids]);
  return { ids, isSaved, toggle, ready };
}
