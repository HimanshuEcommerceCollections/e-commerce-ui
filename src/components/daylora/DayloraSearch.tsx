"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import publicProductService from "@/services/public/product.service";
import type { SearchSuggestResponse } from "@/types/api/product.types";
import { DayloraIcon } from "./DayloraIcons";
import { usd } from "./shop/catalog";
import { catalogHref, deptIcon, useDepartments, type Department } from "./shop/departments";

/**
 * Header search with suggestions (FR-ST-08), following the design's
 * autocomplete: up to 7 query suggestions with the untyped part in bold, the
 * top one scoped to its main product type, 3 product matches, "See all
 * results", recent and popular searches on an empty box, ↑ ↓ Enter Esc, and
 * the ARIA combobox pattern. Suggestions come from GET /api/search/suggest.
 */

const RECENT_KEY = "ec-recent-searches";
const norm = (t: string) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9&%]+/g, " ").trim();

/** Suggest responses by normalized query, for the page's lifetime (the empty query holds "Popular searches"). */
const suggestCache = new Map<string, SearchSuggestResponse>();
const EMPTY: SearchSuggestResponse = { suggestions: [], scoped: null, products: [], popular: [] };

function fetchSuggest(q: string): Promise<SearchSuggestResponse> {
  const key = norm(q);
  const hit = suggestCache.get(key);
  if (hit) return Promise.resolve(hit);
  return publicProductService
    .suggest(q)
    .then((res) => {
      const data = { ...EMPTY, ...(res.data.data ?? {}) };
      suggestCache.set(key, data);
      return data;
    })
    .catch(() => EMPTY);
}

/** The department whose sections list this product type, for a scoped suggestion's link. */
function deptOfType(depts: Department[], type: string): string | undefined {
  const t = type.toLowerCase();
  return depts.find((d) => d.sections.some((s) => s.types.some((x) => x.toLowerCase() === t)))?.slug;
}

/** The part the shopper has NOT typed yet is bold. */
function Highlight({ text, q }: { text: string; q: string }) {
  const typed = q.trim();
  const i = typed ? text.toLowerCase().indexOf(typed.toLowerCase()) : -1;
  if (!typed) return <>{text}</>;
  if (i < 0) return <b>{text}</b>;
  const a = text.slice(0, i);
  const m = text.slice(i, i + typed.length);
  const z = text.slice(i + typed.length);
  return (
    <>
      {a && <b>{a}</b>}
      <span className="ac-typed">{m}</span>
      <b>{z}</b>
    </>
  );
}

function getRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const r = [q, ...getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  } catch {
    /* storage unavailable: recent searches are a convenience */
  }
}

interface Option {
  key: string;
  href: string;
  /** Text put in the box while the option is highlighted (query options only). */
  q?: string;
  node: React.ReactNode;
  className?: string;
}

interface DayloraSearchProps {
  id: string;
  className: string;
  placeholder: string;
}

export function DayloraSearch({ id, className, placeholder }: DayloraSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  /** What the shopper typed; `value` shows the highlighted suggestion while arrowing. */
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Suggestions for `typed` (kept while the next ones load, so the list doesn't flicker). */
  const [result, setResult] = useState<{ q: string; data: SearchSuggestResponse } | null>(null);
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const depts = useDepartments();
  const boxId = `${id}-ac`;
  const pathname = usePathname();

  // On a search results page the box shows the query, so it can be refined.
  useEffect(() => {
    const sync = () => {
      const q = pathname === "/catalog" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
      setValue(q);
      setTyped(q);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);

  /** Popular searches are fetched the first time a search box is used. */
  const ensurePopular = useCallback(() => {
    if (popular.length) return;
    fetchSuggest("").then((d) => setPopular(d.popular.slice(0, 8)));
  }, [popular.length]);

  const q = typed.trim();

  // Suggestions for what was typed (the input is already debounced into `typed`).
  useEffect(() => {
    if (!q || !open) return;
    let live = true;
    fetchSuggest(q).then((data) => live && setResult({ q, data }));
    return () => {
      live = false;
    };
  }, [q, open]);
  const data = q ? result?.data ?? null : null;

  const options: Option[] = useMemo(() => {
    const opts: Option[] = [];
    if (!q) {
      recent.forEach((r) =>
        opts.push({
          key: `r-${r}`,
          href: catalogHref({ q: r }),
          q: r,
          node: (
            <>
              <DayloraIcon name="clock" />
              <span>{r}</span>
            </>
          ),
        }),
      );
      popular.forEach((p) =>
        opts.push({
          key: `p-${p}`,
          href: catalogHref({ q: p }),
          q: p,
          node: (
            <>
              <DayloraIcon name="spark" />
              <span>{p}</span>
            </>
          ),
        }),
      );
      return opts;
    }
    if (!data) return opts;
    data.suggestions.slice(0, 7).forEach((t, i) => {
      opts.push({
        key: `q-${t}`,
        href: catalogHref({ q: t }),
        q: t,
        node: (
          <>
            <DayloraIcon name="search" />
            <span>
              <Highlight text={t} q={q} />
            </span>
          </>
        ),
      });
      // Scoped suggestion: the top term within its main product type.
      const s = data.scoped;
      if (i === 0 && s && s.type && norm(s.type) !== norm(s.query)) {
        const dept = s.dept || deptOfType(depts, s.type);
        opts.push({
          key: `s-${s.query}`,
          href: catalogHref({ dept, type: s.type }),
          q: s.query,
          node: (
            <>
              <span style={{ width: 18, flex: "none" }} />
              <span>
                <Highlight text={s.query} q={q} /> <span className="ac-scope">{s.label || `in ${s.type}`}</span>
              </span>
            </>
          ),
        });
      }
    });
    data.products.slice(0, 3).forEach((p) =>
      opts.push({
        key: `x-${p.parentId}`,
        href: `/product/${p.slug || p.productId}`,
        className: "ac-prod",
        node: (
          <>
            <span className="ac-thumb">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" />
              ) : (
                <DayloraIcon name={deptIcon(p.department?.slug)} />
              )}
            </span>
            <span className="ac-pname">
              {p.name}
              <small>{[p.brand, p.productType].filter(Boolean).join(" · ")}</small>
            </span>
            <span className="ac-price">{usd(Number(p.minPrice))}</span>
          </>
        ),
      }),
    );
    opts.push({
      key: "all",
      href: catalogHref({ q }),
      q,
      className: "ac-all",
      node: (
        <>
          <span>See all results for “{q}”</span>
          <DayloraIcon name="arrow" />
        </>
      ),
    });
    return opts;
  }, [q, data, popular, recent, depts]);

  // Section breaks: recent | popular, and queries | products | see all.
  const firstProduct = options.findIndex((o) => o.key.startsWith("x-"));
  const firstPopular = options.findIndex((o) => o.key.startsWith("p-"));
  const allIdx = options.findIndex((o) => o.key === "all");

  // With a query, only "See all results" left means nothing matched: stay closed, as the design does.
  const show = open && (q ? options.length > 1 : options.length > 0);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const openBox = () => {
    ensurePopular();
    setRecent(getRecent());
    setActive(-1);
    setOpen(true);
  };

  const highlight = (i: number) => {
    setActive(i);
    if (i >= 0) {
      const o = options[i];
      if (o.q) setValue(o.q);
      document.getElementById(`${boxId}-o${i}`)?.scrollIntoView({ block: "nearest" });
    } else {
      setValue(typed);
    }
  };

  const go = (o: Option) => {
    if (o.q) saveRecent(o.q);
    close();
    router.push(o.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show && e.key === "ArrowDown") {
      openBox();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight(active + 1 >= options.length ? -1 : active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(active - 1 < -1 ? options.length - 1 : active - 1);
    } else if (e.key === "Escape") {
      if (show) {
        e.preventDefault();
        e.stopPropagation();
        setValue(typed);
        close();
      }
    } else if (e.key === "Enter" && show && active >= 0) {
      e.preventDefault();
      go(options[active]);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    if (!term) return;
    saveRecent(term);
    close();
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(catalogHref({ q: term }));
  };

  // Debounce typing a little, as the design does, so fast typists don't re-rank on every key.
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <form className={`search ${className}`} role="search" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor={id}>
        Search
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={boxId}
        aria-activedescendant={show && active >= 0 ? `${boxId}-o${active}` : undefined}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => {
            setTyped(v);
            setActive(-1);
            setOpen(true);
          }, 80);
        }}
        onFocus={openBox}
        onBlur={() => setTimeout(close, 120)}
        onKeyDown={onKeyDown}
      />
      <button type="submit" aria-label="Search">
        <DayloraIcon name="search" />
      </button>
      <div
        className="ac"
        id={boxId}
        role="listbox"
        aria-label="Search suggestions"
        hidden={!show}
        onMouseDown={(e) => e.preventDefault() /* keep focus in the input while clicking */}
      >
        {!q && recent.length > 0 && <h3>Recent searches</h3>}
        {options.map((o, i) => (
          <React.Fragment key={o.key}>
            {!q && i === firstPopular && (
              <>
                {recent.length > 0 && <div className="ac-sep" />}
                <h3>Popular searches</h3>
              </>
            )}
            {q && i === firstProduct && (
              <>
                {i > 0 && <div className="ac-sep" />}
                <h3>Products</h3>
              </>
            )}
            {q && i === allIdx && i > 0 && <div className="ac-sep" />}
            <Link
              id={`${boxId}-o${i}`}
              href={o.href}
              role="option"
              aria-selected={i === active}
              className={`ac-opt${o.className ? ` ${o.className}` : ""}`}
              onClick={(e) => {
                e.preventDefault();
                go(o);
              }}
            >
              {o.node}
            </Link>
          </React.Fragment>
        ))}
      </div>
    </form>
  );
}
