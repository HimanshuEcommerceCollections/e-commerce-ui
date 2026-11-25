"use client";
import { useCallback, useEffect, useState, type DependencyList } from "react";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Loads something when `deps` change (and on `reload()`), keeping the last
 * answer on screen while the next one loads so lists don't flash.
 */
export function useLoad<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    load()
      .then((data) => live && setState({ data, error: null }))
      .catch((e) => live && setState((s) => ({ data: s.data, error: getApiErrorMessage(e, "Something went wrong. Try again.") })));
    return () => {
      live = false;
    };
    // `load` is a closure over `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: state.data, error: state.error, reload };
}
