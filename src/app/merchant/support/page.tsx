"use client";
import Link from "next/link";
import { useState } from "react";
import { HelpBar, TicketPill, Who } from "@/components/seller/support";
import { Ico, LoadError, Loading, Pill, rel, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { TicketTab } from "@/types/api/seller.types";

const TABS: [TicketTab, string][] = [
  ["open", "Open"],
  ["waiting", "Waiting for you"],
  ["resolved", "Resolved"],
  ["all", "All"],
];

/** Help & support: the seller's tickets (designs/seller/seller-support.html). */
export default function SellerSupportPage() {
  useTitle("Help & support");
  const [tab, setTab] = useState<TicketTab>("open");
  const load = useLoad(() => sellerService.tickets(tab), [tab]);
  const d = load.data;

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Help &amp; support</h1>
          <p>Raise a ticket for anything about your products, orders, payouts or account. Our team answers here and by email.</p>
        </div>
        <div className="sp-ph-a">
          <Link className="sp-btn sp-btn-pri" href="/merchant/support/new">
            <Ico name="plus" />
            Raise a ticket
          </Link>
        </div>
      </div>
      <HelpBar />
      {d?.counts.waiting ? (
        <div className="sp-alert sp-alert-warn" style={{ marginBottom: 16 }}>
          <Ico name="warn" />
          <span>
            <b>
              {d.counts.waiting} ticket{d.counts.waiting > 1 ? "s are" : " is"} waiting for you.
            </b>{" "}
            Our team replied and needs an answer before they can continue.
          </span>
        </div>
      ) : null}
      <section className="sp-ocard" aria-label="Your tickets">
        <div className="sp-otools">
          <div className="sp-tabs" role="tablist" aria-label="Ticket status">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {label}
                {d ? <span className="sp-n">{d.counts[k]}</span> : null}
              </button>
            ))}
          </div>
        </div>
        {load.error && !d ? (
          <div style={{ padding: 16 }}>
            <LoadError error={load.error} onRetry={load.reload} what="your tickets" />
          </div>
        ) : !d ? (
          <Loading />
        ) : d.content.length ? (
          d.content.map((t) => (
            <Link key={t.reference} className={`sp-tk-row sp-${t.status.toLowerCase()}`} href={`/merchant/support/${t.reference}`}>
              <span style={{ minWidth: 0 }}>
                <b>{t.subject}</b>
              </span>
              <TicketPill status={t.status} />
              <span className="sp-tk-meta">
                <span className="sp-mono">{t.reference}</span>
                <span>{t.topicLabel}</span>
                {t.urgent ? <Pill tone="bad">Urgent</Pill> : null}
                <Who name={t.assignee ?? t.team} team={t.assignee ? t.team : undefined} />
                {t.lastMessage ? (
                  <span>
                    Last reply {t.lastMessage.role === "SELLER" ? "from you" : `from ${t.lastMessage.name.split(" ")[0]}`} · {rel(t.lastMessageAt)}
                  </span>
                ) : null}
              </span>
            </Link>
          ))
        ) : (
          <p className="sp-oempty">{tab === "open" ? "No open tickets. If something isn't working, raise a ticket and we'll sort it out." : "Nothing here."}</p>
        )}
      </section>
    </>
  );
}
