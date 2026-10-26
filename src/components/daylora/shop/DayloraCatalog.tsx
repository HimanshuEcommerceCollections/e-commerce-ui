"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import { DayloraIcon } from "../DayloraIcons";
import { ShopIconSprite } from "./ShopIcons";
import { colorHex } from "./catalog";
import { catalogHref, useDepartments, type Department } from "./departments";
import publicProductService from "@/services/public/product.service";
import type { FacetOption, ProductSearchResponse } from "@/types/api/product.types";
import { PlpCard } from "./PlpCard";
import { searchProducts, toCard, toSearchParams, type CardModel, type SearchQuery } from "./storefrontCards";
import {
  PRICES,
  SORTS,
  TYPE_ICON,
  apiFacetKey,
  facetConfig,
  facetLabel,
  isSort,
  orderValues,
  sizeGroups,
  type FacetKey,
  type Selection,
  type SortKey,
  type Toggles,
} from "./plpModel";

/**
 * Product listing and search results (design 02; FR-ST-02/03/04/05/08/13, NFR-03).
 *
 * One template for every department, section, product type, search, deals and
 * new arrivals. Results, disjunctive facet counts, sorting and search (with
 * spelling correction) come from GET /api/products/search, a page at a time
 * ("Load more"). Every choice lives in the URL, so links can be shared and the
 * back button returns to the same results:
 *   scope   dept, g (section slug), q, deals=1, new=1
 *   facets  sec, d, type, size, color, price, brand, fit, material, conn, diet,
 *           skin, format, age, activity, occasion (repeatable), stock=1, sale=1
 *   view    sort=rel|pop|new|asc|desc, n (pages loaded)
 */

const PER_DESKTOP = 16;
const PER_MOBILE = 12;
/** The API's page-size cap; a restored "n" pages load in one request up to this. */
const MAX_SIZE = 100;

const titleCase = (slug: string) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/** "Popular searches" for an empty result, from the suggest API (fetched once). */
let popularCache: Promise<string[]> | null = null;
const loadPopular = () =>
  (popularCache ??= publicProductService
    .suggest("")
    .then((r) => r.data.data?.popular ?? [])
    .catch(() => {
      popularCache = null;
      return [];
    }));

interface Results {
  /** Query (without paging) these results are for. */
  key: string;
  items: CardModel[];
  total: number;
  facets: Record<string, FacetOption[]>;
  search: ProductSearchResponse["search"];
}

/** Writes the URL without a navigation; useSearchParams picks it up. */
function replaceQuery(fn: (u: URLSearchParams) => void, keepPage = false) {
  const u = new URLSearchParams(window.location.search);
  fn(u);
  if (!keepPage) u.delete("n");
  const s = u.toString();
  window.history.replaceState(null, "", s ? `/catalog?${s}` : "/catalog");
}

export function DayloraCatalog() {
  const params = useSearchParams();
  const depts = useDepartments();

  const [per, setPer] = useState<number | null>(null);
  useEffect(() => {
    setPer(window.matchMedia("(min-width:1024px)").matches ? PER_DESKTOP : PER_MOBILE);
  }, []);

  /* ---- Scope from the URL ---- */
  const q = (params.get("q") ?? "").trim().slice(0, 80);
  const SEARCH = !!q;
  const exact = params.get("exact") === "1";
  const deptParam = (params.get("dept") ?? params.get("category") ?? "").toLowerCase();
  const dept = deptParam && deptParam !== "all" ? deptParam : null;
  const newOnly = params.get("new") === "1";
  const dealsParam = params.get("deals") === "1";
  const DEALSPAGE = !dept && dealsParam;
  const deptInfo: Department | undefined = depts.find((d) => d.slug === dept);

  const gParam = (params.get("g") ?? "").toLowerCase();
  const G = useMemo(() => {
    if (!gParam) return null;
    const fromTree = deptInfo?.sections.find(
      (s) => s.slug === gParam || s.name.toLowerCase() === gParam || s.slug.endsWith(`-${gParam}`),
    );
    if (fromTree) return { slug: fromTree.slug, name: fromTree.name };
    // Not in the menu tree: let the server match the slug as given.
    return { slug: gParam, name: titleCase(gParam.replace(/^.*-/, "")) };
  }, [gParam, deptInfo]);

  const cfg = facetConfig({ search: SEARCH, dept });
  // A product-type link without a department (e.g. from a scoped suggestion) still filters by type.
  const typeLink = !dept && !cfg.facets.includes("type") && params.has("type");
  const FKEYS: FacetKey[] = useMemo(
    () => [...(!G && dept ? (["sec"] as FacetKey[]) : []), ...cfg.facets, ...(typeLink ? (["type"] as FacetKey[]) : [])],
    [G, dept, cfg.facets, typeLink],
  );

  /* ---- Selection from the URL ---- */
  const paramKey = params.toString();
  const sel: Selection = useMemo(() => {
    const s: Selection = {};
    FKEYS.forEach((k) => (s[k] = new Set(params.getAll(k))));
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, FKEYS]);
  const toggles: Toggles = useMemo(
    () => ({ stock: params.get("stock") === "1", sale: params.get("sale") === "1" || (dealsParam && !!dept) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramKey, dealsParam, dept],
  );
  const sortParam = params.get("sort");
  const sort: SortKey = isSort(sortParam) ? sortParam : "rel";
  const page = Math.max(1, parseInt(params.get("n") ?? "", 10) || 1);

  /* ---- Server queries: the scope alone, and the scope with filters + sort ---- */
  const scopeQuery: SearchQuery = useMemo(
    () => ({ q: q || undefined, exact: exact && SEARCH, dept: dept ?? undefined, g: G?.slug, new: newOnly, onSale: DEALSPAGE }),
    [q, exact, SEARCH, dept, G, newOnly, DEALSPAGE],
  );
  const scopeKey = toSearchParams(scopeQuery).toString();
  const filtered = FKEYS.some((k) => sel[k]?.size) || toggles.stock || (toggles.sale && !DEALSPAGE);
  const listQuery: SearchQuery = useMemo(() => {
    const out: SearchQuery = { ...scopeQuery };
    FKEYS.forEach((k) => {
      const vals = Array.from(sel[k] ?? []);
      if (vals.length) out[apiFacetKey(k)] = vals;
    });
    if (toggles.stock) out.inStock = 1;
    if (toggles.sale || DEALSPAGE) out.onSale = 1;
    // Relevance on the deals page favours the biggest savings, as before.
    out.sort = sort === "rel" && DEALSPAGE && !SEARCH ? "discount" : sort;
    return out;
  }, [scopeQuery, FKEYS, sel, toggles, sort, DEALSPAGE, SEARCH]);
  const listKey = toSearchParams(listQuery).toString();

  /* ---- Data ---- */
  const [res, setRes] = useState<Results | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // First page(s) whenever the query changes; a restored "n" loads all its pages at once.
  const pageRef = useRef(page);
  pageRef.current = page;
  useEffect(() => {
    if (per == null) return;
    let live = true;
    setError(null);
    setBusy(true);
    const size = Math.min(MAX_SIZE, per * pageRef.current);
    const u = new URLSearchParams(listKey);
    u.set("page", "0");
    u.set("pageSize", String(size));
    searchProducts(u)
      .then((d) => {
        if (!live) return;
        setRes({ key: listKey, items: d.items.map(toCard), total: d.total, facets: d.facets ?? {}, search: d.search });
      })
      .catch((e) => live && setError(getApiErrorMessage(e, "We couldn't load products.")))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [listKey, per, reload]);

  // "Load more": the next page, appended.
  useEffect(() => {
    if (per == null || !res || res.key !== listKey || loadingMore) return;
    const want = Math.min(res.total, page * per);
    if (res.items.length >= want) return;
    let live = true;
    setLoadingMore(true);
    const u = new URLSearchParams(listKey);
    u.set("page", String(Math.floor(res.items.length / per)));
    u.set("pageSize", String(per));
    searchProducts(u)
      .then((d) => {
        if (!live) return;
        setRes((r) => {
          if (!r || r.key !== listKey) return r;
          const seen = new Set(r.items.map((c) => c.id));
          return { ...r, total: d.total, items: [...r.items, ...d.items.map(toCard).filter((c) => !seen.has(c.id))] };
        });
      })
      .catch((e) => live && setError(getApiErrorMessage(e, "We couldn't load more products.")))
      .finally(() => live && setLoadingMore(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, per, res?.key, res?.items.length, listKey]);

  // Size of the unfiltered scope, for the heading count and the empty states.
  const [scopeTotal, setScopeTotal] = useState<{ key: string; total: number } | null>(null);
  useEffect(() => {
    if (!filtered || scopeTotal?.key === scopeKey) return;
    let live = true;
    const u = new URLSearchParams(scopeKey);
    u.set("pageSize", "1");
    searchProducts(u)
      .then((d) => live && setScopeTotal({ key: scopeKey, total: d.total }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [filtered, scopeKey, scopeTotal?.key]);

  const loaded = !!res && per != null;
  const items = res?.items ?? [];
  const n = res?.total ?? 0;
  const scopeN = !filtered ? n : scopeTotal?.key === scopeKey ? scopeTotal.total : n;
  const shownCount = Math.min(n, items.length);
  const result = res?.search ?? null;
  const facetsOf = (k: FacetKey) => res?.facets[apiFacetKey(k)] ?? [];

  const deptName =
    deptInfo?.name ?? res?.facets.dept?.find((o) => o.value === dept)?.label ?? (dept ? titleCase(dept) : null);

  /** Option counts per facet, disjunctive (the server skips a facet's own selection). */
  const counts = useMemo(() => {
    const out: Partial<Record<FacetKey, Map<string, number>>> = {};
    FKEYS.forEach((k) => (out[k] = new Map((res?.facets[apiFacetKey(k)] ?? []).map((o) => [o.value, o.count]))));
    return out;
  }, [FKEYS, res]);
  const valuesOf = useCallback(
    (k: FacetKey) => {
      const s = new Set((res?.facets[apiFacetKey(k)] ?? []).map((o) => o.value));
      sel[k]?.forEach((v) => s.add(v));
      return orderValues(k, Array.from(s));
    },
    [res, sel],
  );
  const visibleFacets = useMemo(
    () =>
      FKEYS.filter((k) => {
        const v = valuesOf(k);
        return v.length && (k === "size" || v.length > 1 || sel[k]?.size);
      }),
    [FKEYS, valuesOf, sel],
  );

  const sectionName = useCallback(
    (slug: string) =>
      deptInfo?.sections.find((s) => s.slug === slug)?.name ??
      res?.facets.g?.find((o) => o.value === slug)?.label ??
      slug,
    [deptInfo, res],
  );
  const deptLabel = useCallback(
    (slug: string) =>
      depts.find((d) => d.slug === slug)?.name ?? res?.facets.dept?.find((o) => o.value === slug)?.label ?? slug,
    [depts, res],
  );
  const valueLabel = (k: FacetKey, v: string) =>
    k === "price"
      ? PRICES.find((r) => r.k === v)?.t ?? v
      : k === "sec"
        ? sectionName(v)
        : k === "d"
          ? deptLabel(v)
          : facetsOf(k).find((o) => o.value === v)?.label || v;

  /* ---- Title, breadcrumb ---- */
  let ttl: string;
  if (SEARCH) ttl = `Results for “${(result?.mode === "corrected" && result.shown) || q}”`;
  else if (!dept) ttl = DEALSPAGE ? "Today's deals" : newOnly ? "New arrivals" : "All products";
  else if (dept === "clothing" && G) ttl = `${G.name}'s clothing`;
  else ttl = G?.name ?? deptName ?? "Products";
  if (newOnly && dept && !SEARCH) ttl = `New in ${ttl.charAt(0).toLowerCase()}${ttl.slice(1)}`;

  useEffect(() => {
    document.title = `${ttl} | Ecommerce Collections`;
  }, [ttl]);

  /* ---- Analytics: one SEARCH event per query (FR-IN-05) ---- */
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (!SEARCH || !res || res.key !== listKey || tracked.current === q) return;
    if (filtered && scopeTotal?.key !== scopeKey) return; // wait for the scope count
    tracked.current = q;
    track("SEARCH", { properties: { query: q, results: scopeN, mode: result?.mode ?? "none" } });
  }, [SEARCH, res, listKey, q, scopeN, result, filtered, scopeTotal, scopeKey]);

  /* ---- Actions (all write the URL) ---- */
  const toggleValue = useCallback((k: FacetKey, v: string) => {
    replaceQuery((u) => {
      const vals = u.getAll(k);
      u.delete(k);
      (vals.includes(v) ? vals.filter((x) => x !== v) : [...vals, v]).forEach((x) => u.append(k, x));
    });
  }, []);
  const clearFacet = (k: FacetKey) => replaceQuery((u) => u.delete(k));
  const setToggle = (k: "stock" | "sale", on: boolean) =>
    replaceQuery((u) => {
      if (on) u.set(k, "1");
      else {
        u.delete(k);
        if (k === "sale" && dept) u.delete("deals");
      }
    });
  const clearAll = () =>
    replaceQuery((u) => {
      FKEYS.forEach((k) => u.delete(k));
      u.delete("stock");
      u.delete("sale");
      if (dept) u.delete("deals");
    });
  const setSort = (s: string) => replaceQuery((u) => (s === "rel" ? u.delete("sort") : u.set("sort", s)), true);

  const gridRef = useRef<HTMLDivElement>(null);
  const focusFrom = useRef<number | null>(null);
  const loadMore = () => {
    focusFrom.current = shownCount;
    replaceQuery((u) => u.set("n", String(page + 1)), true);
  };
  useEffect(() => {
    if (focusFrom.current == null) return;
    const card = gridRef.current?.children[focusFrom.current] as HTMLElement | undefined;
    focusFrom.current = null;
    card?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  }, [shownCount]);

  /* ---- Filter drawer (every width) ---- */
  const [drawer, setDrawer] = useState(false);
  const openBtn = useRef<HTMLButtonElement>(null);
  const allBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const openDrawer = (open: boolean) => {
    setDrawer(open);
    setPopKey(null);
    if (open) setTimeout(() => closeBtn.current?.focus(), 0);
    else (window.matchMedia("(min-width:1024px)").matches ? allBtn : openBtn).current?.focus();
  };
  useEffect(() => {
    document.documentElement.classList.toggle("filters-open", drawer);
    return () => document.documentElement.classList.remove("filters-open");
  }, [drawer]);

  /* ---- Desktop filter pills with popovers ---- */
  const [popKey, setPopKey] = useState<FacetKey | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (popKey && !(e.target as HTMLElement).closest?.(".fpill-wrap")) setPopKey(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (popKey) {
        const k = popKey;
        setPopKey(null);
        document.querySelector<HTMLButtonElement>(`[data-pop="${k}"]`)?.focus();
      } else if (drawer) openDrawer(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popKey, drawer]);

  /* ---- Filter UI ---- */
  const [secOpen, setSecOpen] = useState<Record<string, boolean>>({});
  const defaultOpen = (k: string) =>
    ({ sec: true, d: true, type: false, size: true, color: true, price: true, brand: false, avail: true })[k] ?? true;
  const isOpen = (k: string) => secOpen[k] ?? defaultOpen(k);

  const checks = (k: FacetKey, vals: string[], prefix: string) => (
    <div className="f-opts">
      {vals.map((v) => {
        const c = counts[k]?.get(v) ?? 0;
        const on = !!sel[k]?.has(v);
        return (
          <label key={v} className={`f-opt${!c && !on ? " zero" : ""}`}>
            <input
              type="checkbox"
              name={`${prefix}-${k}`}
              value={v}
              checked={on}
              disabled={!c && !on}
              onChange={() => toggleValue(k, v)}
            />
            {valueLabel(k, v)}
            <span className="c">{c}</span>
          </label>
        );
      })}
    </div>
  );

  const facetBody = (k: FacetKey, prefix: string) => {
    const vals = valuesOf(k);
    if (k === "size") {
      return (
        <div className="f-opts">
          {sizeGroups(vals).map((g) => (
            <React.Fragment key={g.title}>
              <p className="f-group">{g.title}</p>
              <div className="f-sizes">
                {g.sizes.map((v) => {
                  const c = counts.size?.get(v) ?? 0;
                  const on = !!sel.size?.has(v);
                  const id = `${prefix}-sz-${v}`;
                  return (
                    <div className="f-size" key={v}>
                      <input
                        type="checkbox"
                        id={id}
                        value={v}
                        checked={on}
                        disabled={!c && !on}
                        onChange={() => toggleValue("size", v)}
                      />
                      <label htmlFor={id} title={`${c} products`}>
                        {v}
                      </label>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      );
    }
    if (k === "color") {
      return (
        <div className="f-colors">
          {vals.map((v) => {
            const c = counts.color?.get(v) ?? 0;
            const on = !!sel.color?.has(v);
            return (
              <label key={v} className={`f-opt${!c && !on ? " zero" : ""}`}>
                <input type="checkbox" value={v} checked={on} disabled={!c && !on} onChange={() => toggleValue("color", v)} />
                <span className="dot" style={{ background: colorHex(v) }} />
                <span className="nm">{v}</span>
                <span className="c">{c}</span>
              </label>
            );
          })}
        </div>
      );
    }
    return checks(k, vals, prefix);
  };

  /* ---- Active filter chips ---- */
  const active: { k: FacetKey | "stock" | "sale"; v?: string; t: string }[] = [];
  FKEYS.forEach((k) =>
    sel[k]?.forEach((v) => active.push({ k, v, t: k === "size" ? `Size ${v}` : valueLabel(k, v) })),
  );
  if (toggles.stock) active.push({ k: "stock", t: "In stock only" });
  if (toggles.sale) active.push({ k: "sale", t: "On sale" });
  const removeChip = (a: (typeof active)[number]) => {
    if (a.k === "stock" || a.k === "sale") setToggle(a.k, false);
    else toggleValue(a.k, a.v!);
  };

  /* ---- Quick chips: product types in a department, departments elsewhere ---- */
  const quick = useMemo(() => {
    if (dept) {
      return [...(res?.facets.type ?? [])]
        .filter((o) => o.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((o) => ({ k: "type" as FacetKey, v: o.value, label: o.label || o.value, icon: TYPE_ICON[o.value] ?? null }));
    }
    const present = new Set((res?.facets.dept ?? []).filter((o) => o.count > 0).map((o) => o.value));
    if (SEARCH && present.size < 2) return [];
    return depts
      .filter((d) => present.has(d.slug))
      .map((d) => ({ k: "d" as FacetKey, v: d.slug, label: d.name, icon: d.icon }));
  }, [dept, res, SEARCH, depts]);

  /* ---- Search notes (modes from the server, as plpModel's search had them) ---- */
  const searchNote = (() => {
    if (!SEARCH || !result) return null;
    if (result.mode === "corrected")
      return (
        <p>
          No results for “{q}”. Showing results for <b>{result.shown}</b> instead.
          <Link href={`/catalog?q=${encodeURIComponent(q)}&exact=1`}>Search only for “{q}”</Link>
        </p>
      );
    if (result.mode === "partial")
      return <p>No products match all of “{q}”. Showing products that match some of your words.</p>;
    // Category shortcut: the query names a product type that most results share.
    const qt = q.toLowerCase().trim();
    if (qt.length < 3) return null;
    const types = (res?.facets.type ?? []).filter((o) => o.count > 0 && o.value.toLowerCase().startsWith(qt));
    if (types.length !== 1) return null;
    const { value: type, count } = types[0];
    if (count < scopeN / 2) return null;
    const typeDept = dept ?? items.find((x) => x.productType === type)?.departmentSlug;
    if (!typeDept) return null;
    return (
      <p>
        Looking for a category?
        <Link href={catalogHref({ dept: typeDept, type })}>
          Shop all {type.toLowerCase()} in {deptLabel(typeDept)}
        </Link>
      </p>
    );
  })();

  const noResults = loaded && SEARCH && !scopeN && res?.key === listKey;
  const [popular, setPopular] = useState<string[]>([]);
  useEffect(() => {
    if (noResults) loadPopular().then(setPopular);
  }, [noResults]);
  const shownText = `${n} ${SEARCH ? "result" : "product"}${n === 1 ? "" : "s"}`;
  const sortLabel = SORTS.find((s) => s.k === sort)!.t;
  const colorSel = sel.color?.size ? sel.color : null;

  /* ---- Render ---- */
  return (
    <main id="main" className={`plp${SEARCH ? " is-search" : ""}${noResults ? " no-results" : ""}`}>
      <ShopIconSprite />
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <DayloraIcon name="chev" />
          {SEARCH ? (
            <span aria-current="page">Search results</span>
          ) : !dept ? (
            <span aria-current="page">{ttl}</span>
          ) : G ? (
            <>
              <Link href={catalogHref({ dept })}>{deptName}</Link>
              <DayloraIcon name="chev" />
              <span aria-current="page">{G.name}</span>
            </>
          ) : (
            <span aria-current="page">{deptName}</span>
          )}
        </nav>

        <div className="plp-head">
          <div className="plp-title">
            <h1>{ttl}</h1>
            {loaded && (
              <span id="count">
                {SEARCH ? `${scopeN} result${scopeN === 1 ? "" : "s"}` : `${scopeN} products`}
              </span>
            )}
          </div>
          {searchNote && (
            <div className="search-note" role="status">
              {searchNote}
            </div>
          )}
          {quick.length > 1 && (
            <div className="quick" role="group" aria-label={dept ? "Shop by product type" : "Shop by department"}>
              {quick.map((c) => (
                <button
                  key={c.v}
                  className="qchip"
                  aria-pressed={!!sel[c.k]?.has(c.v)}
                  onClick={() => toggleValue(c.k, c.v)}
                >
                  {c.icon && <DayloraIcon name={c.icon} />}
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bar">
          <button ref={openBtn} aria-controls="filters" aria-expanded={drawer} onClick={() => openDrawer(true)}>
            <DayloraIcon name="filter" />
            Filter
            {active.length > 0 && <span className="badge-n">{active.length}</span>}
          </button>
          <span className="sort-wrap">
            <DayloraIcon name="sort" />
            <span>{sort === "rel" ? "Sort" : sortLabel}</span>
            <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.k} value={s.k}>
                  {s.t}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="plp-grid">
          <div className="f-backdrop" onClick={() => openDrawer(false)} />
          <aside className="filters" id="filters" aria-label="Filters" aria-hidden={!drawer}>
            <div className="f-head">
              <h2>Filters</h2>
              <button ref={closeBtn} className="icon-btn" aria-label="Close filters" onClick={() => openDrawer(false)}>
                <DayloraIcon name="close" />
              </button>
            </div>
            <div className="f-body">
              {visibleFacets.map((k) => {
                const label = facetLabel(k, cfg.gLabel);
                const count = sel[k]?.size ?? 0;
                return (
                  <details
                    key={k}
                    className="f-sec"
                    open={isOpen(k)}
                    onToggle={(e) => {
                      const open = (e.currentTarget as HTMLDetailsElement).open;
                      if (open !== isOpen(k)) setSecOpen((s) => ({ ...s, [k]: open }));
                    }}
                  >
                    <summary>
                      {label}
                      {count > 0 && <span className="n">{count}</span>}
                      <DayloraIcon name="chev" />
                    </summary>
                    {facetBody(k, "drawer")}
                  </details>
                );
              })}
              <details
                className="f-sec"
                open={isOpen("avail")}
                onToggle={(e) => {
                  const open = (e.currentTarget as HTMLDetailsElement).open;
                  if (open !== isOpen("avail")) setSecOpen((s) => ({ ...s, avail: open }));
                }}
              >
                <summary>
                  Availability
                  {(toggles.stock ? 1 : 0) + (toggles.sale ? 1 : 0) > 0 && (
                    <span className="n">{(toggles.stock ? 1 : 0) + (toggles.sale ? 1 : 0)}</span>
                  )}
                  <DayloraIcon name="chev" />
                </summary>
                <div className="f-opts">
                  <label className="f-switch">
                    In stock only
                    <input
                      type="checkbox"
                      role="switch"
                      checked={toggles.stock}
                      onChange={(e) => setToggle("stock", e.target.checked)}
                    />
                  </label>
                  <label className="f-switch">
                    On sale
                    <input
                      type="checkbox"
                      role="switch"
                      checked={toggles.sale}
                      onChange={(e) => setToggle("sale", e.target.checked)}
                    />
                  </label>
                </div>
              </details>
            </div>
            <div className="f-foot">
              <button className="btn btn-secondary" onClick={clearAll}>
                Clear all
              </button>
              <button className="btn btn-primary" onClick={() => openDrawer(false)}>
                {n ? `Show ${n} result${n > 1 ? "s" : ""}` : "No results"}
              </button>
            </div>
          </aside>

          <section aria-label="Products">
            <div className="fbar">
              <button
                ref={allBtn}
                className="fpill fall"
                aria-controls="filters"
                aria-expanded={drawer}
                onClick={() => openDrawer(true)}
              >
                <DayloraIcon name="filter" />
                All filters
                {active.length > 0 && <span className="badge-n">{active.length}</span>}
              </button>
              <div className="fpills">
                {visibleFacets.slice(0, 5).map((k) => {
                  const label = facetLabel(k, cfg.gLabel);
                  const c = sel[k]?.size ?? 0;
                  return (
                    <div className="fpill-wrap" key={k}>
                      <button
                        className={`fpill${c ? " on" : ""}`}
                        data-pop={k}
                        aria-expanded={popKey === k}
                        aria-haspopup="true"
                        onClick={() => setPopKey(popKey === k ? null : k)}
                      >
                        {label}
                        {c ? ` · ${c}` : ""}
                        <DayloraIcon name="chev" className="icon chev" />
                      </button>
                      {popKey === k && (
                        <div className="fpop" role="dialog" aria-label={`${label} filter`}>
                          <div className="fpop-body">{facetBody(k, "pop")}</div>
                          <div className="fpop-foot">
                            <button className="clr" onClick={() => clearFacet(k)}>
                              Clear
                            </button>
                            <button className="done" onClick={() => setPopKey(null)}>
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="fbar-sp" />
              <p id="showing" aria-live="polite">
                {loaded ? shownText : ""}
              </p>
              <div className="sort">
                <label htmlFor="plp-sort">Sort</label>
                <select id="plp-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map((s) => (
                    <option key={s.k} value={s.k}>
                      {s.t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="m-count" aria-live="polite">
              {loaded ? shownText : ""}
            </p>
            {active.length > 0 && (
              <div className="chips" role="group" aria-label="Active filters">
                {active.map((a) => (
                  <button
                    key={`${a.k}:${a.v ?? ""}`}
                    className="chip"
                    aria-label={`Remove filter: ${a.t}`}
                    onClick={() => removeChip(a)}
                  >
                    {a.t}
                    <DayloraIcon name="close" />
                  </button>
                ))}
                <button className="chip-clear" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            )}

            {error ? (
              <div className="pgrid">
                <div className="empty" role="alert" style={{ gridColumn: "1/-1" }}>
                  <span className="empty-ic">
                    <DayloraIcon name="alert" />
                  </span>
                  <h2>Products didn&apos;t load</h2>
                  <p>{error}</p>
                  <button className="btn btn-primary" onClick={() => setReload((r) => r + 1)}>
                    Try again
                  </button>
                </div>
              </div>
            ) : !loaded ? (
              <div className="pgrid" aria-busy="true" aria-label="Loading products">
                {Array.from({ length: 10 }, (_, i) => (
                  <div className="skel-card" key={i}>
                    <div className="skel" style={{ aspectRatio: "4/5" }} />
                    <div className="skel" style={{ height: 12, width: "40%" }} />
                    <div className="skel" style={{ height: 16, width: "85%" }} />
                    <div className="skel" style={{ height: 20, width: "30%" }} />
                  </div>
                ))}
              </div>
            ) : noResults ? (
              <div className="pgrid">
                <div className="empty no-res" style={{ gridColumn: "1/-1" }}>
                  <span className="empty-ic">
                    <DayloraIcon name="search" />
                  </span>
                  <h2>No results for “{q}”</h2>
                  <p>Check the spelling, try a more general word like “jacket” or “speaker”, or browse a department.</p>
                  {popular.length > 0 && (
                    <div className="sugg">
                      <h3>Popular searches</h3>
                      <div>
                        {popular.map((p) => (
                          <Link key={p} className="qchip" href={catalogHref({ q: p })}>
                            {p}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="sugg">
                    <h3>Shop by department</h3>
                    <div>
                      {depts.map((d) => (
                        <Link key={d.slug} className="qchip" href={catalogHref({ dept: d.slug })}>
                          <DayloraIcon name={d.icon} />
                          {d.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : !n ? (
              <div className="pgrid">
                <div className="empty" style={{ gridColumn: "1/-1" }}>
                  <span className="empty-ic">
                    <DayloraIcon name="filter" />
                  </span>
                  <h2>{scopeN ? "No products match these filters" : "Nothing here yet"}</h2>
                  <p>
                    {scopeN
                      ? `Try removing a filter or two, or browse the full ${ttl.toLowerCase()} range.`
                      : "We're adding products to this range. Browse another department in the meantime."}
                  </p>
                  {scopeN ? (
                    <button className="btn btn-primary" onClick={clearAll}>
                      Clear all filters
                    </button>
                  ) : (
                    <Link className="btn btn-primary" href="/catalog">
                      Shop all products
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="pgrid" ref={gridRef} aria-busy={busy}>
                {items.map((x, i) => (
                  <PlpCard key={x.id} c={x} colors={colorSel} delay={Math.min(i % (per ?? PER_MOBILE), 11) * 35} />
                ))}
              </div>
            )}

            {loaded && n > 0 && (
              <div className="more" aria-live="polite">
                {n > shownCount ? (
                  <>
                    <p>
                      You&apos;ve viewed {shownCount} of {n} products
                    </p>
                    <div className="more-bar" aria-hidden="true">
                      <i style={{ width: `${(shownCount / n) * 100}%` }} />
                    </div>
                    <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore}>
                      Load more
                    </button>
                  </>
                ) : n > (per ?? PER_MOBILE) ? (
                  <>
                    <p>You&apos;ve viewed all {n} products</p>
                    <div className="more-bar" aria-hidden="true">
                      <i style={{ width: "100%" }} />
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
