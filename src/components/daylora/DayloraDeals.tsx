"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { DayloraDealCard, type AddToCart } from "./DayloraProductCard";
import { catalogHref } from "./shop/departments";
import type { CardModel } from "./shop/storefrontCatalog";

/** Seconds to the next midnight, US Eastern (deals reset daily). */
function secondsToMidnightET(): number {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const end = new Date(et);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - et.getTime()) / 1000));
}

function Countdown() {
  // Rendered after mount only, so server and client HTML agree.
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(secondsToMidnightET());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = left === null ? null : Math.floor(left / 3600);
  const m = left === null ? null : Math.floor((left % 3600) / 60);
  const s = left === null ? null : left % 60;
  return (
    <div className="deal-end">
      <span>Ends in</span>
      <b aria-live="off" aria-label={h === null ? undefined : `${h} hours ${m} minutes left`}>
        {h === null ? "--:--:--" : `${pad(h)}:${pad(m!)}:${pad(s!)}`}
      </b>
    </div>
  );
}

interface DayloraDealsProps {
  deals: CardModel[];
  loading: boolean;
  onAdd: AddToCart;
}

/** Deals of the day (FR-ST-01): price below MRP only — no promo engine in P0. */
export function DayloraDeals({ deals, loading, onAdd }: DayloraDealsProps) {
  return (
    <section className="band deals" id="deals" data-note="FR-ST-01 · Deals (price vs. was-price only — no promo engine in P0)" aria-busy={loading}>
      <div className="daylora-container">
        <div className="section-head">
          <div>
            <span className="t-eyebrow">Today only</span>
            <h2 className="t-h2">Deals of the day</h2>
          </div>
          <Countdown />
        </div>
        <div className="dgrid">
          {loading
            ? Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="deal deal-skel" aria-hidden="true">
                  <div className="d-media skel" />
                  <div className="d-body">
                    <div className="skel" style={{ height: 12, width: "35%" }} />
                    <div className="skel" style={{ height: 18, width: "80%" }} />
                    <div className="skel" style={{ height: 28, width: "45%" }} />
                    <div className="skel" style={{ height: 44, borderRadius: 999, marginTop: 12 }} />
                  </div>
                </div>
              ))
            : deals.map((p) => <DayloraDealCard key={p.id} product={p} onAdd={onAdd} />)}
        </div>
        <Link href={catalogHref({ deals: true })} className="link deals-all">
          See all deals <DayloraIcon name="arrow" />
        </Link>
      </div>
    </section>
  );
}
