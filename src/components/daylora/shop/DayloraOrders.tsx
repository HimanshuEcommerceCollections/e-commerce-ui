"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import orderService from "@/services/order.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { OrderSummary } from "@/types/api/order.types";
import { DayloraIcon } from "../DayloraIcons";
import { fmtDate, money, orderStatusLabel, orderTone } from "./orderStatus";

const PAGE = 10;

/** Order history (FR-ST-12). */
export function DayloraOrders() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Your orders · Daylora";
    setSignedIn(!!localStorage.getItem("accessToken"));
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    orderService
      .getOrders({ page, size: PAGE })
      .then((res) => {
        if (!live) return;
        const data = res.data.data!;
        setOrders((prev) => (page === 0 ? data.content : [...(prev ?? []), ...data.content]));
        setTotal(data.totalElements);
      })
      .catch((err) => live && setError(getApiErrorMessage(err, "We couldn't load your orders.")));
    return () => { live = false; };
  }, [signedIn, page]);

  if (signedIn === false) {
    return (
      <main id="main" className="acct">
        <div className="daylora-container">
          <div className="empty">
            <span className="empty-ic"><DayloraIcon name="user" /></span>
            <h2>Sign in to see your orders</h2>
            <p>Track deliveries, cancel an order or request a return.</p>
            <Link className="btn btn-primary" href="/login?next=/orders">Sign in</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="acct">
      <div className="daylora-container">
        <div className="acct-head">
          <h1>Your orders</h1>
          {orders && <p>{total} order{total === 1 ? "" : "s"}</p>}
        </div>
        {error && <p className="notice err" role="alert"><DayloraIcon name="alert" />{error}</p>}
        {!orders && !error && (
          <div className="order-rows" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 88, borderRadius: 12 }} />)}
          </div>
        )}
        {orders && !orders.length && (
          <div className="empty">
            <span className="empty-ic"><DayloraIcon name="box" /></span>
            <h2>No orders yet</h2>
            <p>When you place an order, you can track it here.</p>
            <Link className="btn btn-primary" href="/catalog">Start shopping</Link>
          </div>
        )}
        {orders && orders.length > 0 && (
          <ul className="order-rows">
            {orders.map((o) => (
              <li key={o.id}>
                <Link className="order-row" href={`/orders/${o.id}`}>
                  <span className="o-num">{o.orderNumber}</span>
                  <span className="o-total">{money(o.grandTotal, o.currency)}</span>
                  <span className="o-date">Placed {fmtDate(o.createdAt)}</span>
                  <span style={{ textAlign: "right" }}>
                    <span className={`pill ${orderTone(o.status)}`}>{orderStatusLabel(o)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {orders && orders.length < total && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => setPage(page + 1)}>Show more orders</button>
          </div>
        )}
      </div>
    </main>
  );
}
