import React from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { DayloraProductCard } from "./DayloraProductCard";
import { ProductItem } from "./dayloraData";

interface DayloraProductRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  viewAllText?: string;
  viewAllHref?: string;
  products: ProductItem[];
  isDeal?: boolean;
  isBand?: boolean;
  dataNote?: string;
  onAddToCart?: (p: ProductItem) => void;
}

export function DayloraProductRail({
  id,
  title,
  subtitle,
  eyebrow,
  viewAllText = "View all",
  viewAllHref = "/catalog",
  products,
  isDeal = false,
  isBand = false,
  dataNote,
  onAddToCart,
}: DayloraProductRailProps) {
  const sectionClass = isBand ? "band deals" : "section";

  return (
    <section id={id} className={sectionClass} data-note={dataNote}>
      <div className="daylora-container">
        <div className="section-head">
          <div>
            {eyebrow && <span className="t-eyebrow">{eyebrow}</span>}
            <h2 className="t-h2">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Link href={viewAllHref} className="link">
            {viewAllText} <DayloraIcon name="arrow" />
          </Link>
        </div>
        <div className="rail">
          {products.map((p) => (
            <DayloraProductCard
              key={p.id}
              product={p}
              isDeal={isDeal}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
