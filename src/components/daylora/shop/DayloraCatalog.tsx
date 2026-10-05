"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import publicCategoryService from "@/services/public/category.service";
import type { ProductSummaryResponse } from "@/types/api/product.types";
import type { CategoryResponse } from "@/types/api/category.types";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import { DayloraIcon } from "../DayloraIcons";
import { CATEGORIES } from "../dayloraData";
import {
  colorHex,
  compareSizes,
  groupByParent,
  loadAllSkus,
  matchesQuery,
  relevance,
  stockState,
  usd,
  type ListingProduct,
} from "./catalog";
import { CLOTHING, clothingHref, findSubcategory, matchesType, subcategoryOf, type Subcategory } from "./taxonomy";

/* ---- Facets (FR-ST-04) ---- */
type FacetKey = "category" | "size" | "color" | "price" | "brand";

const PRICES = [
  { k: "u10", t: "Under $10", f: (x: number) => x < 10 },
  { k: "10-25", t: "$10 – $25", f: (x: number) => x >= 10 && x < 25 },
  { k: "25-50", t: "$25 – $50", f: (x: number) => x >= 25 && x < 50 },
  { k: "50-100", t: "$50 – $100", f: (x: number) => x >= 50 && x < 100 },
  { k: "o100", t: "$100 & over", f: (x: number) => x >= 100 },
];

/** FR-ST-05: relevance, popularity (units sold), price, new arrivals. */
const SORTS = [
  { k: "rel", t: "Relevance" },
  { k: "pop", t: "Popularity" },
  { k: "new", t: "Newest" },
  { k: "asc", t: "Price: low to high" },
  { k: "desc", t: "Price: high to low" },
] as const;
type SortKey = (typeof SORTS)[number]["k"];

const SORT_FN: Record<SortKey, (a: ListingProduct, b: ListingProduct) => number> = {
  rel: (a, b) => a.rank - b.rank,
  pop: (a, b) => b.popularity - a.popularity || a.rank - b.rank,
  new: (a, b) => b.createdAt - a.createdAt,
  asc: (a, b) => a.minPrice - b.minPrice,
  desc: (a, b) => b.maxPrice - a.maxPrice,
};

const FACET_LABEL: Record<FacetKey, string> = {
  category: "Department", size: "Size", color: "Color", price: "Price", brand: "Brand",
};

/** A product matches a price bucket when any of its variants is priced inside it. */
const FACET_VALUES: Record<FacetKey, (p: ListingProduct) => string[]> = {
  category: (p) => (p.category ? [p.category] : []),
  size: (p) => p.sizes,
  color: (p) => p.colors,
  price: (p) => PRICES.filter((r) => p.variants.some((v) => r.f(v.price))).map((r) => r.k),
  brand: (p) => (p.brand ? [p.brand] : []),
};

const DEFAULT_OPEN: Record<string, boolean> = {
  category: true, size: true, color: true, price: true, brand: false, avail: true,
};

type Selection = Record<FacetKey, Set<string>>;
const emptySelection = (): Selection => ({
  category: new Set(), size: new Set(), color: new Set(), price: new Set(), brand: new Set(),
});

const deptIcon = (name: string | null) =>
  CATEGORIES.find((c) => name && (c.name === name || c.shortName === name))?.icon ?? "box";

export function DayloraCatalog() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const categoryParam = (params.get("category") ?? "").toLowerCase();
  const newOnly = params.get("new") === "1";
  const dealsOnly = params.get("deals") === "1";
  const sub = findSubcategory(params.get("g"));
  const typeParam = params.get("type");
  const type = typeParam
    ? (sub ? sub.types : CLOTHING.flatMap((s) => s.types)).find((t) => t.name === typeParam) ?? null
    : null;

  const [skus, setSkus] = useState<ProductSummaryResponse[] | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [sel, setSel] = useState<Selection>(emptySelection);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>(() => {
    const s = params.get("sort");
    return SORTS.some((x) => x.k === s) ? (s as SortKey) : "rel";
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const shownBefore = useRef(0);
  const openBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    setSkus(null);
    Promise.all([loadAllSkus(), publicCategoryService.getAll()])
      .then(([list, cats]) => {
        if (!live) return;
        setSkus(list);
        setCategories(cats.data.data ?? []);
      })
      .catch((err) => live && setError(getApiErrorMessage(err, "We couldn't load products.")));
    return () => { live = false; };
  }, [reload]);

  // Desktop loads 16 per step, mobile 12 (design: "Load more" beats pagination).
  useEffect(() => {
    setPerPage(window.matchMedia("(min-width:1024px)").matches ? 16 : 12);
  }, []);

  // A new search or department starts from a clean slate.
  useEffect(() => {
    setSel(emptySelection());
    setInStockOnly(false);
    setPage(1);
  }, [q, categoryParam, newOnly, dealsOnly, sub, type]);

  // Filter drawer below 1024px.
  const toggleDrawer = useCallback((open: boolean) => {
    setDrawerOpen(open);
    document.documentElement.classList.toggle("filters-open", open);
    (open ? closeBtn : openBtn).current?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.documentElement.classList.contains("filters-open")) toggleDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("filters-open");
    };
  }, [toggleDrawer]);

  // Exact slug or name first; then a prefix, so the homepage's "clothing" finds "clothing-fashion".
  const category = useMemo(() => {
    if (!categoryParam) return null;
    const lower = (c: CategoryResponse) => [c.slug.toLowerCase(), c.name.toLowerCase()];
    return (
      categories.find((c) => lower(c).includes(categoryParam)) ??
      categories.find((c) => lower(c).some((v) => v.startsWith(categoryParam))) ??
      null
    );
  }, [categories, categoryParam]);
  const unknownCategory = !!categoryParam && skus !== null && !category;

  const products = useMemo(() => (skus ? groupByParent(skus) : []), [skus]);
  const scope = useMemo(
    () =>
      products.filter(
        (p) =>
          (!category || p.category === category.name) &&
          (!sub || inSubcategory(p, sub)) &&
          (!type || matchesType(typeText(p), type)) &&
          (!newOnly || p.isNew) &&
          (!dealsOnly || p.onSale) &&
          matchesQuery(p, q),
      ),
    [products, category, sub, type, newOnly, dealsOnly, q],
  );

  /** Product-type chips for the current section, as in the design. */
  const typeChips = useMemo(() => {
    if (!sub) return [];
    const inSection = products.filter(
      (p) => (!category || p.category === category.name) && inSubcategory(p, sub),
    );
    return sub.types.filter((t) => inSection.some((p) => matchesType(typeText(p), t)));
  }, [products, category, sub]);

  const facetKeys: FacetKey[] = category
    ? ["size", "color", "price", "brand"]
    : ["category", "size", "color", "price", "brand"];

  /** Disjunctive facets: a facet's own selection doesn't narrow its counts. */
  const matches = useCallback(
    (p: ListingProduct, skip?: FacetKey) => {
      for (const k of facetKeys) {
        if (k === skip || !sel[k].size) continue;
        if (!FACET_VALUES[k](p).some((v) => sel[k].has(v))) return false;
      }
      return !(inStockOnly && p.stock === 0);
    },
    // facetKeys is derived from category
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, inStockOnly, category],
  );

  const list = useMemo(() => {
    const shown = scope.filter((p) => matches(p));
    // With a search, relevance ranks name and brand hits first (FR-ST-08).
    if (sort === "rel" && q) return shown.sort((a, b) => relevance(b, q) - relevance(a, q) || a.rank - b.rank);
    return shown.sort(SORT_FN[sort]);
  }, [scope, matches, sort, q]);

  // FR-IN-05: one search event per query, with how many products it found.
  useEffect(() => {
    if (q && skus) track("SEARCH", { properties: { query: q.slice(0, 200), results: scope.length } });
    // Only when the query (or the loaded catalog) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, skus]);
  const n = list.length;
  const pages = Math.max(1, Math.ceil(n / perPage));
  const current = Math.min(page, pages);
  const slice = list.slice(0, current * perPage);

  const countFor = (k: FacetKey, v: string) =>
    scope.filter((p) => matches(p, k) && FACET_VALUES[k](p).includes(v)).length;
  const valuesOf = (k: FacetKey) => Array.from(new Set(scope.flatMap(FACET_VALUES[k])));

  const toggle = (k: FacetKey, v: string) => {
    setSel((prev) => {
      const next = { ...prev, [k]: new Set(prev[k]) };
      if (next[k].has(v)) next[k].delete(v);
      else next[k].add(v);
      return next;
    });
    setPage(1);
  };
  const clearAll = () => {
    setSel(emptySelection());
    setInStockOnly(false);
    setPage(1);
  };

  const active: { k: FacetKey | "stock"; v: string; t: string }[] = [];
  facetKeys.forEach((k) =>
    sel[k].forEach((v) =>
      active.push({ k, v, t: k === "size" ? `Size ${v}` : k === "price" ? PRICES.find((r) => r.k === v)!.t : v }),
    ),
  );
  if (inStockOnly) active.push({ k: "stock", v: "", t: "In stock only" });

  let title = category?.name ?? "All products";
  if (sub) title = type ? `${sub.key === "kids" ? "Kids'" : `${sub.label}'s`} ${type.name.toLowerCase()}` : sub.title;
  else if (type) title = type.name;
  if (q) title = `Results for “${q}”`;
  else if (dealsOnly) title = "Today's deals";
  else if (newOnly) title = category ? `New in ${category.name}` : "New arrivals";

  useEffect(() => {
    document.title = `${title} · Daylora`;
  }, [title]);

  const loadMore = () => {
    shownBefore.current = slice.length;
    setPage(current + 1);
  };

  /* ---- Filter panel ---- */
  const section = (key: string, label: string, count: number, body: React.ReactNode) => (
    <details key={key} className="f-sec" open={DEFAULT_OPEN[key]}>
      <summary>
        {label}
        {count > 0 && <span className="n">{count}</span>}
        <DayloraIcon name="chev" />
      </summary>
      {body}
    </details>
  );

  const checks = (k: FacetKey, vals: string[], labelOf: (v: string) => string = (v) => v) => (
    <div className="f-opts">
      {vals.map((v) => {
        const c = countFor(k, v), on = sel[k].has(v);
        return (
          <label key={v} className={`f-opt${!c && !on ? " zero" : ""}`}>
            <input type="checkbox" checked={on} disabled={!c && !on} onChange={() => toggle(k, v)} />
            {labelOf(v)}
            <span className="c">{c}</span>
          </label>
        );
      })}
    </div>
  );

  const filterPanel = facetKeys.map((k) => {
    const vals = valuesOf(k);
    if (!vals.length || (vals.length < 2 && !sel[k].size)) return null;
    if (k === "size") {
      return section("size", "Size", sel.size.size, (
        <div className="f-opts">
          <div className="f-sizes">
            {vals.sort(compareSizes).map((v) => {
              const c = countFor("size", v), on = sel.size.has(v);
              return (
                <div key={v} className="f-size">
                  <input type="checkbox" id={`sz-${v}`} checked={on} disabled={!c && !on} onChange={() => toggle("size", v)} />
                  <label htmlFor={`sz-${v}`} title={`${c} products`}>{v}</label>
                </div>
              );
            })}
          </div>
        </div>
      ));
    }
    if (k === "color") {
      return section("color", "Color", sel.color.size, (
        <div className="f-colors">
          {vals.sort().map((v) => {
            const c = countFor("color", v), on = sel.color.has(v);
            return (
              <label key={v} className={`f-opt${!c && !on ? " zero" : ""}`}>
                <input type="checkbox" checked={on} disabled={!c && !on} onChange={() => toggle("color", v)} />
                <span className="dot" style={{ background: colorHex(v) }} />
                <span className="nm">{v}</span>
                <span className="c">{c}</span>
              </label>
            );
          })}
        </div>
      ));
    }
    if (k === "price") {
      return section("price", "Price", sel.price.size,
        checks("price", PRICES.filter((r) => vals.includes(r.k)).map((r) => r.k), (v) => PRICES.find((r) => r.k === v)!.t));
    }
    return section(k, FACET_LABEL[k], sel[k].size, checks(k, vals.sort()));
  });

  const loading = skus === null && !error;
  const shownLabel = `${n} product${n === 1 ? "" : "s"}`;

  return (
    <main id="main" className="plp">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb" data-note="FR-ST-02 · Breadcrumb from taxonomy">
          <Link href="/">Home</Link>
          <DayloraIcon name="chev" />
          {category && (sub || type || q || newOnly || dealsOnly) ? (
            <>
              <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>
              <DayloraIcon name="chev" />
            </>
          ) : null}
          {sub && (type || q || newOnly || dealsOnly) ? (
            <>
              <Link href={clothingHref(sub)}>{sub.label}</Link>
              <DayloraIcon name="chev" />
            </>
          ) : null}
          <span aria-current="page">
            {q ? "Search" : dealsOnly ? "Today's deals" : newOnly ? "New arrivals" : type ? type.name : sub ? sub.label : title}
          </span>
        </nav>

        <div className="plp-head">
          <div className="plp-title">
            <h1>{title}</h1>
            {!loading && !error && <span>{scope.length} products</span>}
          </div>
          {sub && typeChips.length > 0 && (
            <div className="plp-quick" aria-label="Shop by product type" data-note="Promoted Category filter (Baymard)">
              {typeChips.map((t) => {
                const on = type?.name === t.name;
                return (
                  <Link key={t.name} className="qchip" aria-pressed={on} href={on ? clothingHref(sub) : clothingHref(sub, t)}>
                    {t.name}
                  </Link>
                );
              })}
            </div>
          )}
          {!category && !sub && !loading && (
            <div className="plp-quick" aria-label="Shop by department" data-note="Promoted Category filter (Baymard)">
              {valuesOf("category").sort().map((c) => (
                <button key={c} className="qchip" aria-pressed={sel.category.has(c)} onClick={() => toggle("category", c)}>
                  <DayloraIcon name={deptIcon(c)} />
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bar">
          <button ref={openBtn} aria-controls="filters" aria-expanded={drawerOpen} onClick={() => toggleDrawer(true)}>
            <DayloraIcon name="filter" />
            Filter
            {active.length > 0 && <span className="badge-n">{active.length}</span>}
          </button>
          <span className="sort-wrap">
            <DayloraIcon name="sort" />
            <span>{sort === "rel" ? "Sort" : SORTS.find((s) => s.k === sort)!.t}</span>
            <select aria-label="Sort products" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}>
              {SORTS.map((s) => <option key={s.k} value={s.k}>{s.t}</option>)}
            </select>
          </span>
        </div>

        <div className="plp-grid">
          <div className="f-backdrop" onClick={() => toggleDrawer(false)} />
          <aside className="filters" id="filters" aria-label="Filters" data-note="FR-ST-04 · Filters">
            <div className="f-head">
              <h2>Filters</h2>
              <button ref={closeBtn} className="icon-btn" aria-label="Close filters" onClick={() => toggleDrawer(false)}>
                <DayloraIcon name="close" />
              </button>
            </div>
            <div className="f-body">
              {filterPanel}
              {section("avail", "Availability", inStockOnly ? 1 : 0, (
                <div className="f-opts">
                  <label className="f-switch">
                    In stock only
                    <input type="checkbox" role="switch" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }} />
                  </label>
                </div>
              ))}
            </div>
            <div className="f-foot">
              <button className="btn btn-secondary" onClick={clearAll}>Clear all</button>
              <button className="btn btn-primary" onClick={() => toggleDrawer(false)}>
                {n ? `Show ${n} result${n > 1 ? "s" : ""}` : "No results"}
              </button>
            </div>
          </aside>

          <section aria-label="Products" data-note="FR-ST-03 · Product list + FR-ST-05 sort">
            <div className="toolbar">
              <p aria-live="polite">{loading ? "Loading products…" : error ? "" : shownLabel}</p>
              <div className="sort">
                <label htmlFor="sort">Sort by</label>
                <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}>
                  {SORTS.map((s) => <option key={s.k} value={s.k}>{s.t}</option>)}
                </select>
              </div>
            </div>
            {!loading && !error && <p className="m-count">{shownLabel}</p>}

            <div className="f-chips" aria-label="Active filters">
              {active.map((a) => (
                <button
                  key={`${a.k}:${a.v}`}
                  className="f-chip"
                  aria-label={`Remove filter: ${a.t}`}
                  onClick={() => (a.k === "stock" ? setInStockOnly(false) : toggle(a.k, a.v))}
                >
                  {a.t}
                  <DayloraIcon name="close" />
                </button>
              ))}
              {active.length > 0 && <button className="f-chip-clear" onClick={clearAll}>Clear all</button>}
            </div>

            <div className="pgrid">
              {loading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="skel-card" aria-hidden="true">
                    <div className="skel" />
                    <div className="skel" style={{ height: 12, width: "40%" }} />
                    <div className="skel" style={{ height: 16, width: "85%" }} />
                    <div className="skel" style={{ height: 20, width: "30%" }} />
                  </div>
                ))
              ) : error ? (
                <div className="empty" role="alert">
                  <span className="empty-ic"><DayloraIcon name="alert" /></span>
                  <h2>Products didn&apos;t load</h2>
                  <p>{error}</p>
                  <button className="btn btn-primary" onClick={() => setReload((r) => r + 1)}>Try again</button>
                </div>
              ) : unknownCategory ? (
                <div className="empty">
                  <span className="empty-ic"><DayloraIcon name="grid" /></span>
                  <h2>This department isn&apos;t open yet</h2>
                  <p>We&apos;re still stocking it. Browse everything that&apos;s available today.</p>
                  <Link className="btn btn-primary" href="/catalog">Shop all products</Link>
                </div>
              ) : !scope.length ? (
                <div className="empty">
                  <span className="empty-ic"><DayloraIcon name="search" /></span>
                  <h2>{q ? `No results for “${q}”` : dealsOnly ? "No deals right now" : "Nothing here yet"}</h2>
                  <p>
                    {q
                      ? "Check the spelling, or try a more general word like a brand or category."
                      : dealsOnly
                      ? "New deals are on their way. Check back soon."
                      : "New products are on their way. Check back soon."}
                  </p>
                  <Link className="btn btn-primary" href="/catalog">Shop all products</Link>
                </div>
              ) : !n ? (
                <div className="empty">
                  <span className="empty-ic"><DayloraIcon name="search" /></span>
                  <h2>No products match these filters</h2>
                  <p>Try removing a filter or two, or browse the full range.</p>
                  <button className="btn btn-primary" onClick={clearAll}>Clear all filters</button>
                </div>
              ) : (
                slice.map((p, i) => {
                  const appended = i >= shownBefore.current;
                  const delay = Math.min(appended ? i - shownBefore.current : i, 11) * 35;
                  return <PlpCard key={p.parentId} product={p} style={appended ? { ["--d" as string]: `${delay}ms` } : { animation: "none" }} />;
                })
              )}
            </div>

            <div className="more" aria-live="polite">
              {n > slice.length ? (
                <>
                  <p>You&apos;ve viewed {slice.length} of {n} products</p>
                  <div className="more-bar" aria-hidden="true"><i style={{ width: `${(slice.length / n) * 100}%` }} /></div>
                  <button className="btn btn-secondary" onClick={loadMore}>Load more</button>
                </>
              ) : n > perPage ? (
                <>
                  <p>You&apos;ve viewed all {n} products</p>
                  <div className="more-bar" aria-hidden="true"><i style={{ width: "100%" }} /></div>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---- Card (FR-ST-03: image, name, price, availability; FR-ST-13 out of stock) ---- */
function PlpCard({ product: p, style }: { product: ListingProduct; style?: React.CSSProperties }) {
  const [imgFailed, setImgFailed] = useState(false);
  const state = stockState(p.stock);
  const c0 = p.colors[0] ? colorHex(p.colors[0]) : null;
  const showImg = p.image && !imgFailed;
  const swatches = p.colors.length > 1 ? p.colors.slice(0, 4) : [];

  return (
    <article className={`pcard${state === "out" ? " is-out" : ""}`} style={style}>
      <div
        className="p-media"
        style={showImg ? undefined : { background: c0 ? `color-mix(in srgb, ${c0} 18%, #F4F6F8)` : "#EEF1F4" }}
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="media-img" src={p.image!} alt="" loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <DayloraIcon name={deptIcon(p.category)} className="icon p-ph" />
        )}
        {p.onSale && p.mrp ? (
          <span className="badge badge-sale">-{Math.round(((p.mrp - p.minPrice) / p.mrp) * 100)}%</span>
        ) : (
          p.isNew && <span className="badge badge-new">New</span>
        )}
        {state === "out" && <span className="oos">Out of stock</span>}
      </div>
      <div
        className="p-sw"
        {...(swatches.length ? { "aria-label": `${p.colors.length} colors: ${p.colors.join(", ")}` } : { "aria-hidden": true })}
      >
        {swatches.map((c) => <i key={c} style={{ background: colorHex(c) }} title={c} />)}
        {p.colors.length > 4 && `+${p.colors.length - 4}`}
      </div>
      {p.brand && <span className="brand">{p.brand}</span>}
      <Link href={p.href} className="p-name">{p.name}</Link>
      <div className="price-row">
        <span className="price">
          {usd(p.minPrice)}
          {p.maxPrice > p.minPrice && <> – {usd(p.maxPrice)}</>}
        </span>
        {p.mrp && <span className="was"><span className="sr-only">Was </span>{usd(p.mrp)}</span>}
      </div>
      {state === "out" ? (
        <span className="stock out">Out of stock</span>
      ) : state === "low" ? (
        <span className="stock low">Only {p.stock} left</span>
      ) : null}
    </article>
  );
}

/** The PLP section a product belongs to: its catalog subcategory, else the SKU code (GS-CL-MEN-001). */
function inSubcategory(p: ListingProduct, sub: Subcategory): boolean {
  if (p.subcategory) return p.subcategory.toLowerCase() === sub.label.toLowerCase();
  return subcategoryOf(p.code)?.key === sub.key;
}

/** Product type matching reads the catalog Product_Type as well as the name. */
const typeText = (p: ListingProduct) => [p.name, p.productType].filter(Boolean).join(" ");
