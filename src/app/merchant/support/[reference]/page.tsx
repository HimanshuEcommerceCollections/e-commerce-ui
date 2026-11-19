"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveBlob, timeOf } from "@/components/seller/orders";
import { ATTACH_ACCEPT, MAX_FILES, TicketPill, pickFiles } from "@/components/seller/support";
import { FieldError, Ico, LoadError, Loading, Pill, errorText, initials, rel, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { TicketDetail } from "@/types/api/seller.types";

function RelatedLink({ t }: { t: TicketDetail }) {
  if (!t.related) return null;
  const { type, ref } = t.related;
  if (type === "order") return <Link href={`/merchant/orders/${encodeURIComponent(ref)}`}>Order {ref}</Link>;
  if (type === "payout") return <Link href="/merchant/orders/earnings">Payout {ref}</Link>;
  return <Link href={`/merchant/products?open=${ref}`}>Product</Link>;
}

/** One ticket: the conversation, reply, resolve or reopen (designs/seller/seller-support.html, #t/…). */
export default function TicketPage() {
  const { reference } = useParams<{ reference: string }>();
  useTitle(reference);
  const me = useAuthStore((s) => s.user);
  const load = useLoad(() => sellerService.ticket(reference), [reference]);
  const [fresh, setFresh] = useState(false);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "resolve" | "reopen" | null>(null);
  const t = load.data;

  useEffect(() => {
    setFresh(new URLSearchParams(window.location.search).get("raised") === "1");
  }, []);

  const act = async (kind: "send" | "resolve" | "reopen") => {
    setErr(null);
    if (kind === "send" && reply.trim().length < 2 && !files.length) {
      setErr("Write your reply first");
      document.getElementById("sp-rtx")?.focus();
      return;
    }
    setBusy(kind);
    try {
      const res =
        kind === "send"
          ? await sellerService.replyTicket(reference, reply.trim(), files)
          : kind === "resolve"
            ? await sellerService.resolveTicket(reference)
            : await sellerService.reopenTicket(reference);
      load.setData(res.data.data);
      setFresh(false);
      if (kind === "send") {
        setReply("");
        setFiles([]);
        toast.success(`Sent. ${t?.assignee ? t.assignee.split(" ")[0] : "Our team"} will reply here.`);
      } else toast.success(kind === "resolve" ? "Ticket resolved. Thanks!" : "Ticket reopened");
    } catch (e) {
      setErr(errorText(e, "That didn't go through. Try again."));
    } finally {
      setBusy(null);
    }
  };

  const download = async (id: string, name: string) => {
    try {
      saveBlob((await sellerService.ticketAttachment(reference, id)).data, name);
    } catch (e) {
      toast.error(errorText(e, "We couldn't download this file."));
    }
  };

  if (load.error && !t) {
    return (
      <>
        <p className="sp-crumb">
          <Link href="/merchant/support">Help &amp; support</Link> / {reference}
        </p>
        <LoadError error={load.error} onRetry={load.reload} what="this ticket" />
      </>
    );
  }
  if (!t) return <Loading />;
  const owner = t.assignee ?? t.team;

  return (
    <>
      <p className="sp-crumb">
        <Link href="/merchant/support">Help &amp; support</Link> / {t.reference}
      </p>
      {fresh ? (
        <div className="sp-alert sp-alert-ok" style={{ marginBottom: 16 }}>
          <Ico name="check" />
          <span>
            <b>Ticket {t.reference} raised.</b> It&apos;s with our {t.team}. We&apos;ll reply here and email you, usually within 1 business day.
          </span>
        </div>
      ) : null}
      <div className="sp-ohead">
        <div>
          <h1>{t.subject}</h1>
          <div className="sp-meta2">
            <TicketPill status={t.status} />
            <span className="sp-mono">{t.reference}</span>
            <span>{t.topicLabel}</span>
            {t.urgent ? <Pill tone="bad">Urgent</Pill> : null}
            <span>Opened {rel(t.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="sp-od">
        <div className="sp-stack2">
          <section className="sp-card" aria-label="Conversation">
            <ol className="sp-thread">
              {t.messages.map((m) => {
                const mine = m.role === "SELLER";
                return (
                  <li key={m.id} className={`sp-msg${mine ? " sp-mine" : ""}`}>
                    <span className="sp-av-m" aria-hidden="true">
                      {initials(mine ? me?.fullName || me?.email || "You" : m.name)}
                    </span>
                    <div className="sp-bub">
                      <div className="sp-mh">
                        <b>{mine ? "You" : m.name}</b>
                        {mine ? null : <small>{t.team}</small>}
                        <small>· {timeOf(m.createdAt)}</small>
                      </div>
                      {m.body ? <p>{m.body}</p> : null}
                      {m.attachments.length ? (
                        <div className="sp-files">
                          {m.attachments.map((a) => (
                            <button key={a.id} type="button" onClick={() => download(a.id, a.fileName)}>
                              <Ico name="doc" />
                              {a.fileName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
              {t.status === "RESOLVED" ? <li className="sp-sysline">Marked as resolved {t.resolvedAt ? rel(t.resolvedAt) : ""}</li> : null}
            </ol>
          </section>
          {t.status !== "RESOLVED" ? (
            <section className="sp-card">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("send");
                }}
              >
                <div className="sp-ch">
                  <h2>Reply</h2>
                </div>
                <label className="sp-sr" htmlFor="sp-rtx">
                  Your reply
                </label>
                <textarea
                  className="sp-inp"
                  id="sp-rtx"
                  rows={4}
                  maxLength={5000}
                  value={reply}
                  aria-invalid={err ? true : undefined}
                  onChange={(e) => {
                    setReply(e.target.value);
                    setErr(null);
                  }}
                  placeholder={t.status === "WAITING" ? `Answer ${owner.split(" ")[0]}'s question…` : "Add more details…"}
                />
                <FieldError id="sp-rte">{err}</FieldError>
                <div className="sp-attach" style={{ marginTop: 10 }}>
                  <label className="sp-btn sp-btn-ghost sp-btn-sm" htmlFor="sp-rfile">
                    <Ico name="doc" />
                    Attach files
                  </label>
                  <input
                    type="file"
                    id="sp-rfile"
                    multiple
                    className="sp-sr"
                    accept={ATTACH_ACCEPT}
                    onChange={(e) => {
                      const p = pickFiles(e.target.files);
                      setFiles(p.files);
                      setFileNote(p.problem);
                      e.target.value = "";
                    }}
                  />
                  <span className="sp-help">{files.length ? files.map((f) => f.name).join(", ") : fileNote ?? `Screenshots, PDFs or spreadsheets · up to ${MAX_FILES} files`}</span>
                  <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={!!busy} onClick={() => act("resolve")}>
                      Mark as resolved
                    </button>
                    <button type="submit" className="sp-btn sp-btn-pri sp-btn-sm" disabled={!!busy}>
                      {busy === "send" ? "Sending…" : "Send reply"}
                    </button>
                  </span>
                </div>
              </form>
            </section>
          ) : (
            <section className="sp-card">
              <p style={{ fontSize: 14 }}>Still a problem? Reopen the ticket and our {t.team} will pick it up again.</p>
              <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" style={{ marginTop: 10 }} disabled={!!busy} onClick={() => act("reopen")}>
                Reopen ticket
              </button>
              <FieldError id="sp-ro-e">{err}</FieldError>
            </section>
          )}
        </div>
        <aside className="sp-side2">
          <section className="sp-card">
            <div className="sp-ch">
              <h2>Details</h2>
            </div>
            <dl className="sp-money" style={{ fontSize: 13.5 }}>
              <dt>Status</dt>
              <dd>
                <TicketPill status={t.status} />
              </dd>
              <dt>Assigned to</dt>
              <dd>{t.assignee ?? "Next available"}</dd>
              <dt>Team</dt>
              <dd>{t.team}</dd>
              <dt>Topic</dt>
              <dd>{t.topicLabel}</dd>
              {t.related ? (
                <>
                  <dt>About</dt>
                  <dd>
                    <RelatedLink t={t} />
                  </dd>
                </>
              ) : null}
              <dt>Priority</dt>
              <dd>{t.urgent ? "Urgent" : "Normal"}</dd>
            </dl>
            <p className="sp-note-s">Only our {t.team.toLowerCase()} and managers can see this ticket.</p>
          </section>
          <Link className="sp-btn sp-btn-sec" href="/merchant/support/new">
            <Ico name="plus" />
            Raise another ticket
          </Link>
        </aside>
      </div>
    </>
  );
}
