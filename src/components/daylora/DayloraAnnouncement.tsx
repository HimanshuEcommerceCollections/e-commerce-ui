"use client";

import React from "react";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { shippingPromise } from "./dayloraData";

/** Shipping and returns promise from the store settings, so it never contradicts checkout (FR-ST-06). */
export function DayloraAnnouncementBar() {
  const config = useStoreConfig();
  const ship = config ? shippingPromise(config.freeShippingThreshold) : null;
  return (
    <div className="announce" data-note="Announcement bar">
      <div className="daylora-container">
        {config && (
          <>
            {ship && (
              <>
                <span>
                  <b>Free shipping</b> {ship.short}
                </span>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
              </>
            )}
            <span className={ship ? "extra" : undefined}>Free {config.returnWindowDays}-day returns</span>
          </>
        )}
      </div>
    </div>
  );
}
