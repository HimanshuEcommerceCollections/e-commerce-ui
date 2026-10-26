"use client";

import React, { useEffect, useState } from "react";
import publicProductService from "@/services/public/product.service";
import type { ProductReview, RatingDistribution } from "@/types/api/product.types";
import { DayloraIcon } from "../DayloraIcons";
import { Stars } from "../DayloraRating";

/**
 * PDP pieces from design 03 that depend on the department: the built-in size
 * guide, the FDA-style Nutrition Facts panel, the toy small-parts warning,
 * "How to use" steps, pack sizes, and the Reviews accordion.
 */

/* ------------------------------------------------------------ size guide */

const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];

type Row = string[];
function Chart({ head, rows }: { head: string[]; rows: Row[] }) {
  return (
    <div className="chart-wrap">
      <table className="chart">
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <th scope="row">{r[0]}</th>
              {r.slice(1).map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Measure({ children }: { children: React.ReactNode }) {
  return (
    <div className="fit-tip">
      <DayloraIcon name="ruler" />
      <span>
        <b>How to measure:</b> {children}
      </span>
    </div>
  );
}

/**
 * The design's built-in size tables (guideHTML), picked by size system:
 * waist sizes, women's numeric, women's alpha or men's alpha.
 */
export function SizeGuideTables({
  sizes,
  women,
  fit,
  jackets,
}: {
  sizes: string[];
  women: boolean;
  fit: string | undefined;
  jackets: boolean;
}) {
  const first = sizes[0] ?? "";
  const n = Number(first);
  const alpha = !first || LETTERS.includes(first.toUpperCase());
  if (!alpha && !Number.isNaN(n) && n >= 24) {
    return (
      <>
        <Chart
          head={["Size", "Waist (in)", "Hip (in)", "Inseam (in)"]}
          rows={[
            ["28", "28–29", "35", "30 / 32"],
            ["30", "30–31", "37", "30 / 32"],
            ["32", "32–33", "39", "30 / 32 / 34"],
            ["34", "34–35", "41", "30 / 32 / 34"],
            ["36", "36–37", "43", "30 / 32 / 34"],
            ["38", "38–39", "45", "30 / 32"],
          ]}
        />
        <Measure>
          measure around your natural waist, where you usually wear your belt. Inseam runs from crotch seam to hem.
        </Measure>
      </>
    );
  }
  if (!alpha && !Number.isNaN(n)) {
    return (
      <>
        <Chart
          head={["Size", "Waist (in)", "Hip (in)"]}
          rows={[
            ["0", "24", "34"],
            ["2", "25", "35"],
            ["4", "26", "36"],
            ["6", "27", "37"],
            ["8", "28", "38"],
            ["10", "29", "39"],
            ["12", "30½", "40½"],
            ["14", "32", "42"],
            ["16", "33½", "43½"],
          ]}
        />
        <Measure>measure the narrowest part of your waist and the fullest part of your hips.</Measure>
      </>
    );
  }
  const fitText = fit ? ` ${fit} fit` : "";
  if (women) {
    return (
      <>
        <Chart
          head={["Size", "US", "Bust (in)", "Waist (in)", "Hip (in)"]}
          rows={[
            ["XS", "0–2", "32–33", "25–26", "35–36"],
            ["S", "4–6", "34–35", "27–28", "37–38"],
            ["M", "8–10", "36–37", "29–30", "39–40"],
            ["L", "12–14", "38½–40", "31½–33", "41½–43"],
            ["XL", "16", "41½", "34½", "44½"],
            ["XXL", "18", "43", "36", "46"],
          ]}
        />
        <Measure>
          bust at the fullest point, waist at the narrowest, hips at the fullest.{fitText && `${fitText}.`}
        </Measure>
      </>
    );
  }
  return (
    <>
      <Chart
        head={["Size", "Chest (in)", "Waist (in)", "Sleeve (in)"]}
        rows={[
          ["XS", "34–36", "28–30", "32½"],
          ["S", "36–38", "30–32", "33"],
          ["M", "39–41", "32–34", "34"],
          ["L", "42–44", "35–37", "35"],
          ["XL", "45–47", "38–40", "36"],
          ["XXL", "48–50", "41–43", "36½"],
        ]}
      />
      <Measure>
        wrap a tape around the fullest part of your chest, under the arms.
        {fitText &&
          `${fitText}${jackets ? ", so pick your usual size, or size up to layer over a hoodie" : ""}.`}
      </Measure>
    </>
  );
}

/* ------------------------------------------------------------- nutrition */

/** Nutrient rows of the panel: label, indent, daily value (same unit as the amount), default unit. */
const NUTRIENTS: { key: string; label: string; match: RegExp; ind?: boolean; dv?: number; unit: string; bold?: boolean }[] = [
  { key: "fat", label: "Total Fat", match: /^(total)?fat$/, dv: 78, unit: "g", bold: true },
  { key: "sat", label: "Saturated Fat", match: /saturated/, ind: true, dv: 20, unit: "g" },
  { key: "trans", label: "Trans Fat", match: /trans/, ind: true, unit: "g" },
  { key: "chol", label: "Cholesterol", match: /cholesterol/, dv: 300, unit: "mg", bold: true },
  { key: "na", label: "Sodium", match: /sodium/, dv: 2300, unit: "mg", bold: true },
  { key: "carb", label: "Total Carbohydrate", match: /carb/, dv: 275, unit: "g", bold: true },
  { key: "fib", label: "Dietary Fiber", match: /fiber|fibre/, ind: true, dv: 28, unit: "g" },
  { key: "sug", label: "Total Sugars", match: /^(total)?sugars?$/, ind: true, unit: "g" },
  { key: "add", label: "Added Sugars", match: /added/, ind: true, dv: 50, unit: "g" },
  { key: "pro", label: "Protein", match: /protein/, unit: "g", bold: true },
];

interface Nutrition {
  serving?: string;
  servings?: string;
  calories?: string;
  values: Record<string, string>;
}

const keyOf = (k: string) => k.toLowerCase().replace(/[^a-z]/g, "");

/**
 * Reads the importer's `Nutrition` attribute: JSON, or "Serving size: 1 oz (28g);
 * Calories: 150; Total Fat: 10g; …" (separated by ; | or new lines, "key: value"
 * or "key value"). Null when it doesn't name any nutrient.
 */
export function parseNutrition(raw: string | undefined): Nutrition | null {
  if (!raw?.trim()) return null;
  let pairs: [string, string][] = [];
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") pairs = Object.entries(obj).map(([k, v]) => [k, String(v)]);
  } catch {
    pairs = raw
      .split(/[;\n|]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const m = /^(.+?)\s*[:=]\s*(.+)$/.exec(p) ?? /^(.*?[a-z])\s+(\d.*)$/i.exec(p);
        return m ? ([m[1], m[2].trim()] as [string, string]) : (["", p] as [string, string]);
      })
      .filter(([k]) => k);
  }
  const out: Nutrition = { values: {} };
  pairs.forEach(([k, v]) => {
    const key = keyOf(k);
    if (/servingsize|^serving$/.test(key)) out.serving = v;
    else if (/servings/.test(key)) out.servings = v;
    else if (/calories|energy/.test(key)) out.calories = v;
    else {
      const n = NUTRIENTS.find((x) => x.match.test(key));
      if (n && !(n.key in out.values)) out.values[n.key] = v;
    }
  });
  return out.calories || Object.keys(out.values).length ? out : null;
}

/** US-style Nutrition Facts label (design nfHTML). */
export function NutritionPanel({ n }: { n: Nutrition }) {
  const amount = (v: string, unit: string) => (/^\s*[\d.]+\s*$/.test(v) ? `${v.trim()}${unit}` : v);
  const dv = (v: string, d?: number) => {
    const x = parseFloat(v);
    return d && Number.isFinite(x) ? `${Math.round((x / d) * 100)}%` : "";
  };
  return (
    <div className="nf" role="table" aria-label="Nutrition Facts">
      <h4>Nutrition Facts</h4>
      {(n.servings || n.serving) && (
        <div className="serv">
          {n.servings && (
            <>
              {/^\d/.test(n.servings) ? `About ${n.servings} servings per container` : n.servings}
              <br />
            </>
          )}
          {n.serving && (
            <>
              <b>Serving size</b> <b style={{ float: "right" }}>{n.serving}</b>
            </>
          )}
        </div>
      )}
      {n.calories && (
        <div className="cal">
          <span>Calories</span>
          <b>{n.calories}</b>
        </div>
      )}
      <div className="dv">% Daily Value*</div>
      {NUTRIENTS.filter((x) => n.values[x.key]).map((x) => (
        <div key={x.key} className={`row${x.ind ? " ind" : ""}`}>
          <span>
            {x.bold ? <b>{x.label}</b> : x.label} {amount(n.values[x.key], x.unit)}
          </span>
          {x.dv ? <b>{dv(n.values[x.key], x.dv)}</b> : <span />}
        </div>
      ))}
      <p className="foot">
        * The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000
        calories a day is used for general nutrition advice.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ toys, use */

/** Small-parts warning (16 CFR 1500.19): building sets and games for ages 3–8. */
export function needsChokingWarning(dept: string | undefined, type: string | null, age: string | undefined): boolean {
  if (dept !== "toys-kids" || !type || !/building sets|games & puzzles/i.test(type) || !age) return false;
  const n = parseInt(age.match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(n) && n >= 3 && n <= 8;
}

export function ChokingWarning() {
  return (
    <div className="warn-box" role="note">
      <span className="tri" aria-hidden="true" />
      <span>
        <b>WARNING: CHOKING HAZARD</b>Small parts. Not for children under 3 yrs.
      </span>
    </div>
  );
}

/** "Wet hair. Apply. Rinse." or one step per line → steps, without any "1." numbering. */
export function toSteps(text: string): string[] {
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const steps = lines.length > 1 ? lines : text.replace(/([.!])\s+(?=[A-Z])/g, "$1\n").split("\n");
  return steps.map((s) => s.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim()).filter(Boolean);
}

/** Units in a pack from a variant name: "Pack of 3", "6-Pack", "12 ct" → n; else 1. */
export function packCount(name: string | null | undefined): number {
  if (!name) return 1;
  const m = /pack of (\d+)|(\d+)\s*[- ]?\s*(?:pack|ct|count)\b/i.exec(name);
  const n = m ? parseInt(m[1] ?? m[2], 10) : 1;
  return n > 0 ? n : 1;
}

/* --------------------------------------------------------------- reviews */

interface Summary {
  average: number;
  count: number;
  distribution: RatingDistribution;
}

const PAGE = 5;

/** "Reviews (n)" accordion (design reviewsHTML), from GET /api/products/:id/reviews. Hidden with no reviews. */
export function PdpReviews({ productId, fallback }: { productId: string; fallback: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(fallback);
  const [list, setList] = useState<ProductReview[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    publicProductService
      .getReviews(productId, { page, size: PAGE, sort: "recent" })
      .then((res) => {
        const d = res.data.data;
        if (!live || !d) return;
        setSummary(d.summary);
        setList((prev) => (page === 0 ? d.page.content : [...prev, ...d.page.content.filter((r) => !prev.some((p) => p.id === r.id))]));
        setMore(d.page.number + 1 < d.page.totalPages);
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [productId, page]);

  if (!summary || !summary.count) return null;
  const n = summary.count;
  const avg = Number(summary.average);
  return (
    <details className="acc acc-reviews" id="reviews">
      <summary>
        <span>Reviews ({n})</span>
        <DayloraIcon name="chev" />
      </summary>
      <div className="acc-body">
        <div className="pdp-rev">
          <div className="rev-score">
            <b>{avg.toFixed(1)}</b>
            <Stars avg={avg} label={`Rated ${avg.toFixed(1)} out of 5`} />
            <span className="opt-hint">
              Based on {n} review{n === 1 ? "" : "s"}
            </span>
            <div className="bars" aria-hidden="true">
              {([5, 4, 3, 2, 1] as const).map((s) => {
                const c = Number(summary.distribution?.[String(s) as keyof RatingDistribution] ?? 0);
                return (
                  <div key={s}>
                    {s} ★<i style={{ "--w": `${n ? Math.round((c / n) * 100) : 0}%` } as React.CSSProperties} />
                    {c}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rev-list">
            {list.map((r) => (
              <article className="rev" key={r.id}>
                <span className="rating" role="img" aria-label={`Rated ${r.rating} out of 5`}>
                  <Stars avg={r.rating} />
                </span>
                {r.title && <strong className="rev-title">{r.title}</strong>}
                <q>{r.body}</q>
                <div className="rev-who">
                  <div>
                    <strong>{[r.author, r.location].filter(Boolean).join(" · ")}</strong>
                    {r.variant && <span>{r.variant}</span>}
                    {r.verifiedBuyer && (
                      <span className="verified">
                        <DayloraIcon name="shield" />
                        Verified buyer
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {failed && <p className="opt-hint">Reviews didn&apos;t load. Please try again later.</p>}
            {more && (
              <button
                type="button"
                className="btn btn-secondary rev-more"
                disabled={loading}
                aria-busy={loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Show more
              </button>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
