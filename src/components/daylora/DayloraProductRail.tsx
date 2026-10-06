import React from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { DayloraProductCard, type AddToCart } from "./DayloraProductCard";
import type { CardModel } from "./shop/storefrontCatalog";

interface DayloraProductRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  products: CardModel[];
  loading: boolean;
  /** Message shown when there's nothing to list (or the catalog couldn't load). */
  emptyText: string;
  /** "feat": the borderless featured layout, 5 across (design v2). */
  variant?: "feat";
  showNew?: boolean;
  dataNote?: string;
  onAdd: AddToCart;
}

export function DayloraProductRail({
  id,
  title,
  subtitle,
  viewAllHref,
  products,
  loading,
  emptyText,
  variant,
  showNew,
  dataNote,
  onAdd,
}: DayloraProductRailProps) {
  const skeletons = variant === "feat" ? 5 : 6;
  return (
    <section id={id} className="section" data-note={dataNote} aria-busy={loading}>
      <div className="daylora-container">
        <div className="section-head">
          <div>
            <h2 className="t-h2">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Link href={viewAllHref} className="link">
            View all <DayloraIcon name="arrow" />
          </Link>
        </div>
        {!loading && products.length === 0 ? (
          <p className="rail-empty">{emptyText}</p>
        ) : (
          <div className={`rail${variant ? ` ${variant}` : ""}`}>
            {loading
              ? Array.from({ length: skeletons }, (_, i) => (
                  <div key={i} className="skel-card" aria-hidden="true">
                    <div className="skel" />
                    <div className="skel" style={{ height: 12, width: "40%" }} />
                    <div className="skel" style={{ height: 16, width: "85%" }} />
                    <div className="skel" style={{ height: 20, width: "30%" }} />
                    <div className="skel" style={{ height: 40, borderRadius: 999, marginTop: 8 }} />
                  </div>
                ))
              : products.map((p) => <DayloraProductCard key={p.id} product={p} onAdd={onAdd} showNew={showNew} />)}
          </div>
        )}
      </div>
    </section>
  );
}
