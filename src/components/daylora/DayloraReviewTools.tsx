"use client";

import React, { useState } from "react";

export function DayloraReviewTools() {
  const [showGrid, setShowGrid] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showReviews, setShowReviews] = useState(true);

  const toggleGrid = () => {
    const next = !showGrid;
    setShowGrid(next);
    document.body.classList.toggle("show-grid", next);
  };

  const toggleNotes = () => {
    const next = !showNotes;
    setShowNotes(next);
    document.body.classList.toggle("show-notes", next);
  };

  const toggleReviews = () => {
    const next = !showReviews;
    setShowReviews(next);
    document.body.classList.toggle("hide-ratings", !next);
  };

  return (
    <>
      <div className="grid-overlay" aria-hidden="true">
        <div className="daylora-container">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="tools">
        <button
          id="gridBtn"
          aria-pressed={showGrid}
          onClick={toggleGrid}
        >
          Grid
        </button>
        <button
          id="notesBtn"
          aria-pressed={showNotes}
          onClick={toggleNotes}
        >
          PRD labels
        </button>
        <button
          id="ratingsBtn"
          aria-pressed={showReviews}
          onClick={toggleReviews}
        >
          Reviews (P1)
        </button>
      </div>
    </>
  );
}
