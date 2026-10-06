import React from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { catalogHref, type Department } from "./shop/departments";

/** Shop by department (FR-ST-01/02): the nine departments of the taxonomy. */
export function DayloraCategories({ departments }: { departments: Department[] }) {
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
          {departments.map((d) => (
            <Link key={d.slug} href={catalogHref({ dept: d.slug })} className="cat">
              <span className="cat-img">
                <DayloraIcon name={d.icon} />
              </span>
              {d.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
