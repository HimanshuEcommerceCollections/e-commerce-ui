import React from "react";
import { DayloraIcon } from "./DayloraIcons";
import { TRUST_ITEMS } from "./dayloraData";

export function DayloraTrust() {
  return (
    <section
      className="band trust"
      data-note="FR-ST-01 · Trust & service information"
    >
      <div className="daylora-container">
        <h2 className="sr-only">Why shop with us</h2>
        <div className="trust-grid">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="trust-item">
              <span className="trust-ic">
                <DayloraIcon name={item.icon} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
