import React from "react";

export function DayloraAnnouncementBar() {
  return (
    <div className="announce" data-note="Announcement bar">
      <div className="daylora-container">
        <span>
          <b>Free shipping</b> on orders $35+
        </span>
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span className="extra">Free 30-day returns</span>
      </div>
    </div>
  );
}
