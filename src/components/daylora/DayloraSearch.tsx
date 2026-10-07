"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DayloraIcon } from "./DayloraIcons";
import { usd, type ListingProduct } from "./shop/catalog";
import { catalogHref, deptIcon } from "./shop/departments";
import { loadStorefrontCatalog } from "./shop/storefrontCatalog";

/**
 * Header search with suggestions (FR-ST-08), following the design's
 * autocomplete: up to 7 query suggestions with the untyped part in bold, the
 * top one scoped to its main product type, 3 product matches, "See all
 * results", recent and popular searches on an empty box, ↑ ↓ Enter Esc, and
 * the ARIA combobox pattern. Suggestions come from the live catalog.
 */

const RECENT_KEY = "ec-recent-searches";

const norm = (t: string) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9&%]+/g, " ").trim();
const words = (t: string) => norm(t).split(" ").filter((w) => w && w !== "&");
/** "Stainless Steel Cookware Set, 10-Piece" → "Stainless Steel Cookware Set". */
const cleanName = (n: string) =>
  n.replace(/,.*$/, "").replace(/\s+\d[\d,.]*[- ]?(Piece|Pieces|Pack|oz|lb|ml|in|mm|L)\b.*$/i, "").trim();

interface Entry {
  t: string;
  pop: number;
  /** "deptSlug|type" → products. */
  cats: Record<string, number>;
  noScope?: boolean;
}

interface Index {
  entries: Entry[];
  popular: string[];
  products: { p: ListingProduct; hay: string[]; pop: number }[];
}

function buildIndex(products: ListingProduct[]): Index {
  const dict = new Map<string, Entry>();
  const add = (phrase: string | null | undefined, p: ListingProduct, pop: number, boost = 0) => {
    if (!phrase) return null;
    const k = norm(phrase);
    if (k.length < 2) return null;
    const e = dict.get(k) ?? { t: phrase.toLowerCase(), pop: 0, cats: {} };
    e.pop += pop + boost;
    const dept = p.variants[0]?.categorySlug ?? "";
    if (p.productType) {
      const c = `${dept}|${p.productType}`;
      e.cats[c] = (e.cats[c] ?? 0) + 1;
    }
    dict.set(k, e);
    return e;
  };
  const typePop = new Map<string, number>();
  const ranked = products.map((p) => {
    // Popularity on a 0–100-ish scale: units sold, with a floor so new items still surface.
    const pop = Math.min(100, 10 + Math.sqrt(p.popularity) * 10);
    const name = cleanName(p.name);
    add(name, p, pop, 10);
    add(p.productType, p, pop, 20);
    add(p.brand, p, pop);
    p.colors.forEach((c) => {
      const e = add(c, p, 2);
      if (e) e.noScope = true;
    });
    const w = name.toLowerCase().replace(/[^a-z0-9'’ -]+/g, " ").split(/\s+/).filter(Boolean);
    if (w.length > 2) add(w.slice(-2).join(" "), p, pop, 15);
    if (w.length > 1) add(w[w.length - 1], p, pop, 5);
    const sub = p.subcategory;
    if (p.variants[0]?.categorySlug === "clothing" && sub && /^(men|women)$/i.test(sub) && w.length) {
      const last = w[w.length - 1];
      add(`${sub.toLowerCase()}'s ${last}${/s$/.test(last) ? "" : "s"}`, p, pop, 8);
    }
    if (p.productType) typePop.set(p.productType, (typePop.get(p.productType) ?? 0) + pop);
    const hay = words([p.name, p.brand, p.productType, sub, ...p.colors].filter(Boolean).join(" "));
    return { p, hay, pop };
  });
  // Popular searches: the busiest product types in the catalog.
  const popular = Array.from(typePop.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);
  popular.forEach((q) => {
    const e = dict.get(norm(q));
    if (e) e.pop += 400;
  });
  return { entries: Array.from(dict.values()), popular, products: ranked };
}

function querySuggestions(index: Index, q: string): Entry[] {
  const qw = words(q);
  if (!qw.length) return [];
  const last = qw[qw.length - 1];
  const full = qw.slice(0, -1);
  const scored: { e: Entry; score: number }[] = [];
  for (const e of index.entries) {
    const ew = words(e.t);
    const okFull = full.every((f) => ew.some((w) => w === f || w === f + "s" || w + "s" === f));
    const okLast = ew.some((w) => w.startsWith(last));
    if (!okFull || !okLast) continue;
    const starts = norm(e.t).startsWith(norm(q));
    scored.push({ e, score: e.pop + (starts ? 1000 : 0) - ew.length * 5 });
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const { e } of scored) {
    const k = norm(e.t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
    if (out.length === 7) break;
  }
  return out;
}

function productMatches(index: Index, q: string): ListingProduct[] {
  const qw = words(q);
  if (!qw.length) return [];
  return index.products
    .filter(({ hay }) =>
      qw.every((w, i) => hay.some((h) => (i === qw.length - 1 ? h.startsWith(w) : h === w || h === w + "s" || h + "s" === w))),
    )
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 3)
    .map((x) => x.p);
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
  const [index, setIndex] = useState<Index | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
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

  /** The catalog is fetched the first time a search box is used. */
  const ensureIndex = useCallback(() => {
    if (index) return;
    loadStorefrontCatalog()
      .then((products) => setIndex(buildIndex(products)))
      .catch(() => setIndex(buildIndex([])));
  }, [index]);

  const q = typed.trim();
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
      (index?.popular ?? []).forEach((p) =>
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
    if (!index) return opts;
    const qs = querySuggestions(index, q);
    const ps = productMatches(index, q);
    qs.forEach((e, i) => {
      opts.push({
        key: `q-${e.t}`,
        href: catalogHref({ q: e.t }),
        q: e.t,
        node: (
          <>
            <DayloraIcon name="search" />
            <span>
              <Highlight text={e.t} q={q} />
            </span>
          </>
        ),
      });
      if (i === 0 && !e.noScope) {
        // Scoped suggestion: the top term within its main product type.
        const top = Object.entries(e.cats).sort((a, b) => b[1] - a[1])[0];
        if (top) {
          const [dept, type] = top[0].split("|");
          if (type && norm(type) !== norm(e.t)) {
            opts.push({
              key: `s-${e.t}`,
              href: catalogHref({ dept: dept || undefined, type }),
              q: e.t,
              node: (
                <>
                  <span style={{ width: 18, flex: "none" }} />
                  <span>
                    <Highlight text={e.t} q={q} /> <span className="ac-scope">in {type}</span>
                  </span>
                </>
              ),
            });
          }
        }
      }
    });
    ps.forEach((p) =>
      opts.push({
        key: `x-${p.parentId}`,
        href: p.href,
        className: "ac-prod",
        node: (
          <>
            <span className="ac-thumb">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" />
              ) : (
                <DayloraIcon name={deptIcon(p.variants[0]?.categorySlug)} />
              )}
            </span>
            <span className="ac-pname">
              {p.name}
              <small>{[p.brand, p.productType].filter(Boolean).join(" · ")}</small>
            </span>
            <span className="ac-price">{usd(p.minPrice)}</span>
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
  }, [q, index, recent]);

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
    ensureIndex();
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
