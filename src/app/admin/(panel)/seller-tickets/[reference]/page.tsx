"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import sellerTicketsService, { type AdminTicketDetail } from "@/services/admin/sellerTickets.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { Icon, toast, usePageTitle } from "@/components/admin/ui";
import type { TicketStatus } from "@/types/api/seller.types";

const STATUS_PILL: Record<TicketStatus, [string, string]> = {
  OPEN: ["p-info", "With our team"],
  WAITING: ["p-warn", "Waiting for seller"],
  RESOLVED: ["p-ok", "Resolved"],
};
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Where a ticket's "about" points in the admin panel. */
function relatedHref(t: AdminTicketDetail) {
  if (!t.related) return null;
  if (t.related.type === "order") return `/admin/orders?search=${encodeURIComponent(t.related.ref)}`;
  if (t.related.type === "payout") return "/admin/payouts";
  return `/admin/products?open=${t.related.ref}`;
}

/** One seller ticket: the thread, a reply (optionally resolving), assignment. */
export default function SellerTicketPage() {
  const { reference } = useParams<{ reference: string }>();
  usePageTitle(reference);
  const [t, setT] = useState<AdminTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setT((await sellerTicketsService.get(reference)).data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't load this ticket."));
    }
  }, [reference]);
  useEffect(() => {
    void load();
  }, [load]);

  const send = async (resolve: boolean) => {
    if (!resolve && !body.trim() && !files.length) return toast("Write a reply first", true);
    setBusy(resolve ? "resolve" : "send");
    try {
      setT((await sellerTicketsService.reply(reference, body.trim(), files, resolve)).data.data);
      setBody("");
      setFiles([]);
      toast(resolve ? "Ticket resolved. The seller has been emailed." : "Reply sent. The seller has been emailed.");
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't send the reply."), true);
    } finally {
      setBusy(null);
    }
  };
  const assign = async () => {
    setBusy("assign");
    try {
      setT((await sellerTicketsService.assign(reference)).data.data);
      toast("Assigned to you");
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't assign the ticket."), true);
    } finally {
      setBusy(null);
    }
  };
  const download = async (id: string, name: string) => {
    try {
      const blob = (await sellerTicketsService.attachment(reference, id)).data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't download the file."), true);
    }
  };

  if (error && !t) {
    return (
      <>
        <p className="sub">
          <Link className="link" href="/admin/seller-tickets">
            Seller tickets
          </Link>{" "}
          / {reference}
        </p>
        <p className="err-text">{error}</p>
      </>
    );
  }
  if (!t) return <p className="sub">Loading…</p>;
  const rel = relatedHref(t);

  return (
    <>
      <p className="sub" style={{ marginBottom: 8 }}>
        <Link className="link" href="/admin/seller-tickets">
          Seller tickets
        </Link>{" "}
        / {t.reference}
      </p>
      <div className="page-head">
        <div>
          <h1>{t.subject}</h1>
          <p style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`pill ${STATUS_PILL[t.status][0]}`}>{STATUS_PILL[t.status][1]}</span>
            {t.urgent ? <span className="pill p-bad">Urgent</span> : null}
            <span>
              {t.reference} · {t.topicLabel} · opened {when(t.createdAt)}
            </span>
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={assign} disabled={!!busy}>
            <Icon name="users" />
            Assign to me
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1fr)", alignItems: "start" }} className="tk-grid">
        <div className="panel" style={{ padding: 16 }}>
          <ol style={{ display: "grid", gap: 14 }}>
            {t.messages.map((m) => (
              <li
                key={m.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: m.role === "STAFF" ? "var(--mint-50)" : "#fff",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13, marginBottom: 4 }}>
                  <b>{m.role === "SELLER" ? `${m.name} (seller)` : m.name}</b>
                  <span className="sub">{when(m.createdAt)}</span>
                </div>
                {m.body ? <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.body}</p> : null}
                {m.attachments.length ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {m.attachments.map((a) => (
                      <button key={a.id} className="btn btn-secondary btn-sm" onClick={() => download(a.id, a.fileName)}>
                        <Icon name="file" size={14} />
                        {a.fileName}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <label className="sr-only" htmlFor="tk-reply">
              Reply
            </label>
            <textarea
              id="tk-reply"
              className="inp"
              rows={4}
              maxLength={5000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t.status === "RESOLVED" ? "Replying reopens the conversation for the seller…" : "Reply to the seller…"}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label className="btn btn-secondary btn-sm" htmlFor="tk-files">
                <Icon name="upload" size={14} />
                Attach files
              </label>
              <input
                id="tk-files"
                type="file"
                multiple
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx"
                onChange={(e) => {
                  setFiles(Array.from(e.target.files ?? []).slice(0, 5));
                  e.target.value = "";
                }}
              />
              <span className="sub">{files.length ? files.map((f) => f.name).join(", ") : "Up to 5 files, 4 MB each"}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => send(true)} disabled={!!busy}>
                  {busy === "resolve" ? "Resolving…" : body.trim() ? "Reply and resolve" : "Resolve"}
                </button>
                <button className="btn btn-primary" onClick={() => send(false)} disabled={!!busy}>
                  {busy === "send" ? "Sending…" : "Send reply"}
                </button>
              </span>
            </div>
            <p className="sub">The seller gets an email and sees the reply in the Seller Portal. A reply moves the ticket to “Waiting for seller”.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: 16 }}>
          <dl className="kv">
            <dt>Seller</dt>
            <dd>
              {t.seller.company ?? t.seller.name}
              <div className="sub">{t.seller.email}</div>
            </dd>
            <dt>Team</dt>
            <dd>{t.team}</dd>
            <dt>Assigned</dt>
            <dd>{t.assignee ?? "Unassigned"}</dd>
            <dt>Topic</dt>
            <dd>{t.topicLabel}</dd>
            {t.related ? (
              <>
                <dt>About</dt>
                <dd>
                  {rel ? (
                    <Link className="link" href={rel}>
                      {t.related.type} {t.related.ref}
                    </Link>
                  ) : (
                    `${t.related.type} ${t.related.ref}`
                  )}
                </dd>
              </>
            ) : null}
            <dt>Priority</dt>
            <dd>{t.urgent ? "Urgent" : "Normal"}</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
