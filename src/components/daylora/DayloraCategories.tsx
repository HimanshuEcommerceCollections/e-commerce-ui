import React from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { CATEGORIES } from "./dayloraData";

export function DayloraCategories() {
  return (
    <section className="section" data-note="FR-ST-01/02 · Shop by category">
      <div className="daylora-container">
        <div className="section-head">
          <h2 className="t-h2">Shop by department</h2>
          <Link href="/catalog" className="link">
            View all <DayloraIcon name="arrow" />
          </Link>
        </div>
        <div className="cat-grid" id="catGrid">
          {CATEGORIES.map((c) => (
            <Link key={c.name} href={c.href} className="cat">
              <span className="cat-img">
                <DayloraIcon name={c.icon} />
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
