import React from "react";
import { DayloraIcon } from "./DayloraIcons";
import { REVIEWS } from "./dayloraData";

export function DayloraReviews() {
  return (
    <section
      className="section reviews"
      data-note="P1 · Customer reviews — sample content, hidden at launch"
    >
      <div className="daylora-container">
        <div className="section-head">
          <div>
            <div className="rev-head">
              <h2 className="t-h2">What our customers say</h2>
              <span className="sample-pill">Sample · P1</span>
            </div>
            <p>Real reviews from verified buyers</p>
          </div>
          <div className="rev-summary">
            <span
              className="stars"
              style={{ ["--pct" as string]: "92%" }}
              aria-hidden="true"
            />
            <b>4.6</b>
            <span>average rating</span>
          </div>
        </div>

        <div className="rail rev-grid" id="revGrid">
          {REVIEWS.map((v, idx) => (
            <article key={idx} className="rev">
              <span className="rating" aria-label={`Rated ${v.rating} out of 5`}>
                <span
                  className="stars"
                  style={{ ["--pct" as string]: `${v.rating * 20}%` }}
                  aria-hidden="true"
                />
              </span>
              <q>{v.quote}</q>
              <div className="rev-who">
                <span className="rev-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="media-img"
                    src={`/daylora/${v.imgKey}.jpg`}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <div>
                  <strong>
                    {v.name} · {v.location}
                  </strong>
                  <span>Bought: {v.productBought}</span>
                  <span className="verified">
                    <DayloraIcon name="shield" />
                    Verified buyer
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
