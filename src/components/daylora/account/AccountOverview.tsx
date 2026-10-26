"use client";

import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { useAuthStore } from "@/store/useAuthStore";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Steps, Thumb, firstName, headline, isOpen, money, variantText } from "./customerShared";
import { NAV_GROUPS, useAccountShell, useGoLink } from "./accountShell";

const orderHref = (n: string) => `/account/orders/${encodeURIComponent(n)}`;
const memberSince = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

/** Account overview: hello, four tiles, the latest order, quick actions and (phones) the section menu. */
export function OverviewView() {
  const user = useAuthStore((s) => s.user);
  const { summary, signOut } = useAccountShell();
  const saved = useSavedItems();
  const goLink = useGoLink();
  const recent = summary?.latestOrder ?? null;
  const h = recent ? headline(recent) : null;
  const open = summary?.orders.open ?? 0;
  const savedCount = saved.ready ? saved.ids.size : (summary?.savedItems ?? 0);

  return (
    <>
      <section className="ov-hero">
        <div>
          <h1>Hi, {firstName(user?.fullName)}</h1>
          <p>
            {summary ? `Member since ${memberSince(summary.memberSince)} · ` : ""}
            {user?.email}
          </p>
        </div>
        <Link className="btn btn-light" href="/">
          Continue shopping
        </Link>
      </section>

      <div className="tiles">
        <Link className="tile" {...goLink("orders")}>
          <DayloraIcon name="truck" />
          <b>{summary ? summary.orders.total : "–"}</b>
          <span>Orders{open ? ` · ${open} on the way` : ""}</span>
        </Link>
        <Link className="tile" {...goLink("returns")}>
          <DayloraIcon name="return" />
          <b>{summary ? summary.openReturns : "–"}</b>
          <span>Open returns</span>
        </Link>
        <Link className="tile" {...goLink("credit")}>
          <DayloraIcon name="gift" />
          <b>{summary ? money(summary.storeCreditBalance) : "–"}</b>
          <span>Store credit</span>
        </Link>
        <Link className="tile" {...goLink("saved")}>
          <DayloraIcon name="heart" />
          <b>{summary || saved.ready ? savedCount : "–"}</b>
          <span>Saved items</span>
        </Link>
      </div>

      {recent && h && (
        <section className="card" aria-labelledby="rH">
          <div className="trk-h">
            <h2 id="rH">{isOpen(recent.status) ? "On the way" : "Latest order"}</h2>
            <Link className="link" href={orderHref(recent.orderNumber)}>
              View order {recent.orderNumber}
            </Link>
          </div>
          <p className={`oc-st ${h.tone}`}>{h.label}</p>
          {h.line && <p className="oc-sub trk-line">{h.line}</p>}
          <Steps order={recent} />
          <div className="oc-items">
            {recent.items.map((i) => (
              <div className="oc-item" key={i.productId}>
                <Thumb src={i.imageUrl} />
                <span>
                  <b>{i.productName}</b>
                  <span>{variantText(i)}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card qa-card" aria-labelledby="qH">
        <h2 id="qH">Quick actions</h2>
        <div className="qa">
          <Link href="/track">
            <DayloraIcon name="truck" />
            Track a package
          </Link>
          <Link {...goLink("orders")}>
            <DayloraIcon name="return" />
            Return or exchange
          </Link>
          <Link {...goLink("buyagain")}>
            <DayloraIcon name="cart" />
            Buy again
          </Link>
          <Link {...goLink("addresses")}>
            <DayloraIcon name="pin" />
            Edit addresses
          </Link>
          <Link {...goLink("payments")}>
            <DayloraIcon name="card" />
            Payment methods
          </Link>
          <Link href="/help">
            <DayloraIcon name="headset" />
            Get help
          </Link>
        </div>
      </section>

      {/* Phones: the side nav becomes this menu. */}
      <div className="mmenu">
        {NAV_GROUPS.map((g) => (
          <nav className="mgroup" aria-label={g.group} key={g.group}>
            <h2>{g.group}</h2>
            {g.items
              .filter((x) => x.v !== "overview")
              .map((x) => (
                <Link key={x.v} {...goLink(x.v)}>
                  <DayloraIcon name={x.icon} />
                  {x.label}
                  <DayloraIcon name="chev" className="icon chev" />
                </Link>
              ))}
          </nav>
        ))}
        <nav className="mgroup" aria-label="Help">
          <h2>Help</h2>
          <Link href="/track">
            <DayloraIcon name="truck" />
            Track a package
            <DayloraIcon name="chev" className="icon chev" />
          </Link>
          <Link {...goLink("orders")}>
            <DayloraIcon name="return" />
            Start a return or exchange
            <DayloraIcon name="chev" className="icon chev" />
          </Link>
          <Link href="/help">
            <DayloraIcon name="headset" />
            Help center
            <DayloraIcon name="chev" className="icon chev" />
          </Link>
          <Link href="/terms">
            <DayloraIcon name="file" />
            Legal &amp; policies
            <DayloraIcon name="chev" className="icon chev" />
          </Link>
          <a
            href="/"
            className="danger"
            onClick={(e) => {
              e.preventDefault();
              signOut();
            }}
          >
            <DayloraIcon name="arrow" />
            Sign out
            <DayloraIcon name="chev" className="icon chev" />
          </a>
        </nav>
      </div>
    </>
  );
}
