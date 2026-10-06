"use client";
import { useEffect, useState } from "react";
import storeService, { type StoreConfig } from "@/services/public/store.service";

let cached: StoreConfig | null = null;
let pending: Promise<StoreConfig | null> | null = null;

function load(): Promise<StoreConfig | null> {
  if (cached) return Promise.resolve(cached);
  pending ??= storeService
    .getConfig()
    .then((res) => (cached = res.data.data ?? null))
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** Store settings (shipping fees, free-shipping threshold, returns), fetched once per page load. */
export function useStoreConfig(): StoreConfig | null {
  const [config, setConfig] = useState<StoreConfig | null>(cached);
  useEffect(() => {
    let live = true;
    load().then((c) => live && setConfig(c));
    return () => {
      live = false;
    };
  }, []);
  return config;
}

/**
 * Same as useStoreConfig, plus whether the request finished without a config
 * (so a page can show an error instead of loading placeholders forever).
 */
export function useStoreConfigState(): { config: StoreConfig | null; loading: boolean; failed: boolean } {
  const [state, setState] = useState<{ config: StoreConfig | null; loading: boolean }>({ config: cached, loading: !cached });
  useEffect(() => {
    let live = true;
    load().then((c) => live && setState({ config: c, loading: false }));
    return () => {
      live = false;
    };
  }, []);
  return { config: state.config, loading: state.loading, failed: !state.loading && !state.config };
}
