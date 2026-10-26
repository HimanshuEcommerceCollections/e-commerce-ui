"use client";

import React from "react";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { DayloraIcon } from "./DayloraIcons";
import { TRUST_ITEMS, shippingPromise } from "./dayloraData";

export function DayloraTrust() {
  const config = useStoreConfig();
  // Shipping and returns titles follow the store settings once they load.
  const title = (icon: string, fallback: string) => {
    if (!config) return fallback;
    if (icon === "truck") return shippingPromise(config.freeShippingThreshold)?.title ?? "Tracked shipping";
    if (icon === "return") return `Free ${config.returnWindowDays}-day returns`;
    return fallback;
  };
  return (
    <section
      className="band trust"
      data-note="FR-ST-01 · Trust & service information"
    >
      <div className="daylora-container">
        <h2 className="sr-only">Why shop with us</h2>
        <div className="trust-grid">
          {TRUST_ITEMS.map((item) => (
            <div key={item.icon} className="trust-item">
              <span className="trust-ic">
                <DayloraIcon name={item.icon} />
              </span>
              <div>
                <strong>{title(item.icon, item.title)}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
