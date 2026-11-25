"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast, useDebounced, usePageTitle } from "@/components/admin/ui";
import { memberName, useCrm } from "@/components/admin/crm/CrmContext";
import { useLoad } from "@/components/admin/crm/useLoad";
import { Av, CAv, CIcon, ErrText, STATUS_LABEL, Tag, fmtD, initialsOf, k, priDot, rel, slaTxt, tfmt, toneC } from "@/components/admin/crm/ui";
import type { TicketDetail, TicketPriority, TicketRow, TicketStatus, TicketView } from "@/types/api/crm.types";

const VIEWS: Array<[TicketView, string]> = [
  ["mine", "Assigned to me"],
  ["unassigned", "Unassigned"],
  ["overdue", "Past reply time"],
  ["open", "All open"],
  ["pending", "Waiting on them"],
  ["solved", "Solved"],
];

/** Saved replies: {first} is the person's first name, {date} a few days ago. */
const MACROS: Array<[string, string, string]> = [
  ["refund", "Refund timing", "Hi {first}, your refund went out on {date}. Banks usually take 5–10 business days to show it. If it isn’t there by then, reply here and we’ll chase it."],
  ["swap", "Wrong item: swap", "Hi {first}, sorry about that. We’ll send the right item today and email you a prepaid return label for the wrong one. No need to wait for the return."],
  ["track", "Missing delivery", "Hi {first}, I’m sorry your parcel hasn’t turned up. I’ve opened a trace with the carrier and will update you within 24 hours. Could you check with neighbours and any safe place in the meantime?"],
  ["feed", "Feed troubleshooting", "Hi {first}, thanks for flagging. Could you send the time of the last file you uploaded and the file name? We’ll check the import log on our side."],
];

const PAGE = 50;

export default function TicketsPage() {
  return (
    <Suspense fallback={<p className={k("loading")}>Loading…</p>}>
      <Tickets />
    </Suspense>
  );
}

function Tickets() {
  usePageTitle("CRM · Tickets");
  const params = useSearchParams();
  const { version, open } = useCrm();
  const ref = params.get("ref");
  const startView = VIEWS.find(([v]) => v === params.get("view"))?.[0];
  const [view, setView] = useState<TicketView>(startView ?? "open");
  const [who, setWho] = useState<"" | "customer" | "supplier">("");
  const [text, setText] = useState("");
  const q = useDebounced(text.trim(), 250);
  const [limit, setLimit] = useState(PAGE);

  // The overdue shortcut from the dashboard lands here with ?view=overdue.
  useEffect(() => {
    if (startView) setView(startView);
  }, [startView]);
  useEffect(() => setLimit(PAGE), [view, who, q]);

  const list = useLoad(() => crmService.tickets({ view, who: who || undefined, q: q || undefined, size: limit }), [view, who, q, limit, version]);
  const detail = useLoad<TicketDetail | null>(() => (ref ? crmService.ticket(ref) : Promise.resolve(null)), [ref, version]);

  const rows = list.data?.content ?? [];
  const overdue = list.data?.counts.overdue ?? 0;

  return (
    <>
      <div className={k("ph compact")}>
        <div>
          <h1>Tickets</h1>
          <p>Customer and supplier conversations, most urgent first.</p>
        </div>
        <button type="button" className={k("btn pri")} onClick={() => open("ticket")}>
          <CIcon name="plus" />
          New ticket
        </button>
      </div>
      <div className={k(`tix ${ref ? "has-sel" : ""}`)}>
        <section className={k("tlist")} aria-label="Ticket list">
          <div className={k("tls")}>
            <label className={k("srch")}>
              <CIcon name="search" />
              <span className={k("sr")}>Search tickets</span>
              <input placeholder="Search subject, number or name" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            <div className={k("tls-r")}>
              <label className={k("sr")} htmlFor="tvs">
                View
              </label>
              <select className={k("inp sm")} id="tvs" value={view} onChange={(e) => setView(e.target.value as TicketView)}>
                {VIEWS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label} ({list.data?.counts[key] ?? 0})
                  </option>
                ))}
              </select>
              <label className={k("sr")} htmlFor="twho">
                From
              </label>
              <select className={k("inp sm")} id="twho" value={who} onChange={(e) => setWho(e.target.value as typeof who)}>
                <option value="">Everyone</option>
                <option value="customer">Customers</option>
                <option value="supplier">Suppliers</option>
              </select>
            </div>
          </div>
          {overdue && view !== "overdue" ? (
            <button type="button" className={k("tl-alert")} onClick={() => setView("overdue")}>
              <CIcon name="clock" />
              <span>
                <b>{overdue}</b> past reply time
              </span>
              <span className={k("lnk")}>Show</span>
            </button>
          ) : null}
          <ul>
            {list.error && !list.data ? <li className={k("empty")}>{list.error}</li> : null}
            {rows.map((t) => (
              <TicketItem key={t.id} t={t} on={t.reference === ref} />
            ))}
            {list.data && !rows.length ? <li className={k("empty")}>No tickets in this view.</li> : null}
            {list.data && rows.length < list.data.totalElements ? (
              <li>
                <button type="button" className={k("more")} onClick={() => setLimit((n) => n + PAGE)}>
                  Show more ({list.data.totalElements - rows.length} left)
                </button>
              </li>
            ) : null}
          </ul>
        </section>
        <section className={k("tdet")} aria-label="Ticket">
          {ref ? (
            detail.data && detail.data.reference === ref ? (
              <Detail t={detail.data} />
            ) : (
              <p className={k("loading")}>{detail.error ?? "Loading…"}</p>
            )
          ) : (
            <div className={k("tnone")}>
              <CIcon name="inbox" />
              <p>
                <b>Select a ticket</b>
              </p>
              <p className={k("muted")} style={{ fontSize: 13 }}>
                The list is sorted by reply time.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function TicketItem({ t, on }: { t: TicketRow; on: boolean }) {
  const [s, tone] = slaTxt(t);
  return (
    <li>
      <Link href={`/admin/crm/tickets?ref=${t.reference}`} className={k(`ti ${on ? "on" : ""}`)} aria-current={on ? "true" : undefined} scroll={false}>
        <span className={k("tir")}>
          <span className={k(`pri-d ${priDot(t.priority)}`)} title={`${t.priority} priority`} />
          <b>{t.subject}</b>
          <span className={k("ti-t")}>{rel(t.createdAt)}</span>
        </span>
        <span className={k("tir sm")}>
          <span className={k("ell")}>
            {t.requester.name} · {t.requester.kind === "supplier" ? "Supplier" : "Customer"}
          </span>
          <Av member={t.owner} size="xs" />
        </span>
        <span className={k("tir sm")}>
          <span className={k("ell")}>
            {t.reference} · {t.category}
          </span>
          <span className={k(`${toneC(tone)} ${tone === "bad" ? "fw" : ""}`)}>{s}</span>
        </span>
      </Link>
    </li>
  );
}

function Who({ name, id, requester }: { name: string; id: string | null; requester: boolean }) {
  const { members } = useCrm();
  const member = id ? members.find((m) => m.id === id) : undefined;
  return requester || !member ? (
    <span className={k(`av xs ${requester ? "" : "team"}`)} aria-hidden="true">
      {initialsOf(name)}
    </span>
  ) : (
    <Av member={member} size="xs" />
  );
}

function Detail({ t }: { t: TicketDetail }) {
  const { members, changed } = useCrm();
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [s, tone] = slaTxt(t);
  const first = (t.requester.name || "there").split(" ")[0];

  // A new ticket starts with an empty reply box.
  useEffect(() => {
    setBody("");
    setError(null);
  }, [t.id]);

  const set = async (input: { status?: TicketStatus; priority?: TicketPriority; ownerId?: string | null }, msg: string) => {
    try {
      await crmService.updateTicket(t.reference, input);
      toast(msg);
      changed();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't update the ticket."), true);
    }
  };

  const send = async (after: "pending" | "solved" | "note") => {
    if (body.trim().length < 2) {
      setError("Write something first");
      return;
    }
    setBusy(true);
    try {
      await crmService.sendMessage(t.reference, after === "note" ? { body: body.trim(), mode: "note" } : { body: body.trim(), mode: "reply", after });
      toast(after === "note" ? "Note added" : after === "solved" ? "Sent. Ticket solved" : "Sent. Waiting on their reply");
      setBody("");
      setError(null);
      changed();
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't send that."));
    } finally {
      setBusy(false);
    }
  };

  const requester = t.requester;
  const profileHref = requester.id ? `/admin/crm/${requester.kind === "customer" ? "customers" : "suppliers"}/${requester.id}` : null;

  return (
    <>
      <div className={k("tdh")}>
        <Link className={k("btn ghost sm show-m")} href="/admin/crm/tickets">
          <CIcon name="left" />
          All tickets
        </Link>
        <div className={k("tdh-r")}>
          <h2>{t.subject}</h2>
          <span className={k(`sla ${toneC(tone)}`)}>
            <CIcon name="clock" />
            {s}
          </span>
        </div>
        <p className={k("meta")}>
          <span className={k("mono")}>{t.reference}</span>
          <span>{t.category}</span>
          <span>via {t.channel}</span>
          <span>Opened {rel(t.createdAt)}</span>
          {t.linked ? (
            <Link href={t.linked.href} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
              {t.linked.type === "seller_ticket" ? "Seller ticket" : "Help center"} {t.linked.reference}
              <CIcon name="right" />
            </Link>
          ) : null}
        </p>
      </div>
      <div className={k("tbody")}>
        <div className={k("tconv")}>
          <ol className={k("thread")}>
            {t.messages.map((m) => (
              <li key={m.id} className={k(`msg ${m.kind === "requester" ? "c" : m.kind === "staff" ? "a" : "n"}`)}>
                <div className={k("mh")}>
                  <Who name={m.author.name} id={m.author.id} requester={m.kind === "requester"} />
                  <b>{m.author.name}</b>
                  {m.kind === "note" ? <span className={k("tag warn")}>Internal note</span> : null}
                  <time title={tfmt(m.createdAt)}>{rel(m.createdAt)}</time>
                </div>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
          {t.status === "solved" ? (
            <p className={`${k("callout")} ${k("ok")}`}>
              <CIcon name="check" />
              <span>Solved. Change the status to reopen it if they write back.</span>
            </p>
          ) : (
            <form
              className={k(`rep ${mode}`)}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className={k("rep-h")}>
                <div className={k("seg")} role="tablist" aria-label="Message type">
                  <button type="button" role="tab" aria-selected={mode === "reply"} onClick={() => setMode("reply")}>
                    <CIcon name="mail" />
                    Reply to {first}
                  </button>
                  <button type="button" role="tab" aria-selected={mode === "note"} onClick={() => setMode("note")}>
                    <CIcon name="note" />
                    Internal note
                  </button>
                </div>
                {mode === "reply" ? (
                  <>
                    <label className={k("sr")} htmlFor="mac">
                      Insert a saved reply
                    </label>
                    <select
                      className={k("inp fsel")}
                      id="mac"
                      value=""
                      onChange={(e) => {
                        const m = MACROS.find((x) => x[0] === e.target.value);
                        if (m) setBody(m[2].replace("{first}", first).replace("{date}", fmtD(new Date(Date.now() - 3 * 86_400_000).toISOString())));
                      }}
                    >
                      <option value="">Saved replies</option>
                      {MACROS.map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}
              </div>
              <label className={k("sr")} htmlFor="rtx">
                {mode === "reply" ? "Reply" : "Note"}
              </label>
              <textarea
                className={k("inp")}
                id="rtx"
                rows={4}
                value={body}
                aria-invalid={error ? true : undefined}
                placeholder={mode === "reply" ? "Write your reply…" : "Only our team sees this"}
                onChange={(e) => setBody(e.target.value)}
              />
              <span className={k("rte")}>
                <ErrText>{error}</ErrText>
              </span>
              <div className={k("rep-f")}>
                {mode === "reply" ? (
                  <>
                    <button type="button" className={k("btn sec sm")} disabled={busy} onClick={() => send("pending")}>
                      Send, wait for reply
                    </button>
                    <button type="button" className={k("btn pri sm")} disabled={busy} onClick={() => send("solved")}>
                      Send and solve
                    </button>
                  </>
                ) : (
                  <button type="button" className={k("btn pri sm")} disabled={busy} onClick={() => send("note")}>
                    Add note
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        <aside className={k("tside")} aria-label="Ticket properties">
          <label className={k("field")} htmlFor="pst">
            <span className={k("lab")}>Status</span>
            <select className={k("inp sm")} id="pst" value={t.status} onChange={(e) => set({ status: e.target.value as TicketStatus }, `Status: ${STATUS_LABEL[e.target.value as TicketStatus]}`)}>
              {(["open", "pending", "solved"] as const).map((x) => (
                <option key={x} value={x}>
                  {STATUS_LABEL[x]}
                </option>
              ))}
            </select>
          </label>
          <label className={k("field")} htmlFor="ppr">
            <span className={k("lab")}>Priority</span>
            <select className={k("inp sm")} id="ppr" value={t.priority} onChange={(e) => set({ priority: e.target.value as TicketPriority }, `Priority: ${e.target.value[0]!.toUpperCase()}${e.target.value.slice(1)}`)}>
              {(["urgent", "high", "normal", "low"] as const).map((x) => (
                <option key={x} value={x}>
                  {x[0]!.toUpperCase() + x.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className={k("field")} htmlFor="pas">
            <span className={k("lab")}>Assignee</span>
            <select
              className={k("inp sm")}
              id="pas"
              value={t.owner?.id ?? ""}
              onChange={(e) => set({ ownerId: e.target.value || null }, e.target.value ? `Assigned to ${memberName(members, e.target.value)}` : "Unassigned")}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className={`${k("field")} ${k("req-w")}`}>
            <span className={k("lab")}>{requester.kind === "customer" ? "Customer" : "Supplier"}</span>
            {profileHref ? (
              <Link className={k("req")} href={profileHref}>
                <CAv name={requester.name} size="sm" />
                <span className={k("row-m")}>
                  <b>{requester.name}</b>
                  <small>{requester.summary}</small>
                </span>
                <CIcon name="right" />
              </Link>
            ) : (
              <span className={k("req")}>
                <CAv name={requester.name} size="sm" />
                <span className={k("row-m")}>
                  <b>{requester.name}</b>
                  <small>{requester.email ?? "No profile yet"}</small>
                </span>
              </span>
            )}
            {requester.tags.length || t.otherTickets ? (
              <div className={k("tags")}>
                {requester.tags
                  .filter((x) => x !== "Live")
                  .map((x) => (
                    <Tag key={x} tag={x} />
                  ))}
                {t.otherTickets ? (
                  <span className={k("help")} style={{ alignSelf: "center" }}>
                    {t.otherTickets} other ticket{t.otherTickets > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
