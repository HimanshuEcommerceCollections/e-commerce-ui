"use client";
import { useState } from "react";
import Link from "next/link";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast, usePageTitle } from "@/components/admin/ui";
import type { ActivityKind, CustomerProfile, HistoryItem, SupplierProfile } from "@/types/api/crm.types";
import { useCrm } from "./CrmContext";
import { TaskItem, useTaskToggle } from "./TaskItem";
import { CAv, CIcon, DAY, ErrText, StagePill, Tag, dueTxt, fmtD, k, money, rel, tfmt, toneC } from "./ui";
import { useLoad } from "./useLoad";
import { useStageMover } from "./stageMove";

const ICON: Record<string, string> = { note: "note", call: "phone", email: "mail", ticket: "inbox", order: "cart", stage: "kanban", task: "check" };
const KIND_LABEL: Record<string, string> = { note: "Note", call: "Call", email: "Email", ticket: "Ticket", order: "Order", stage: "Stage change", task: "Task" };
type Composer = "note" | "call" | "email";

/**
 * A customer's or supplier's page: who they are, everything that happened with
 * them (notes, calls, emails, tickets, orders or stage changes), their tickets and
 * tasks, and a box to add to the history.
 */
export function ContactProfile({ kind, id }: { kind: "customer" | "supplier"; id: string }) {
  const { members, meta, version, open, changed } = useCrm();
  const isC = kind === "customer";
  const profile = useLoad<CustomerProfile | SupplierProfile>(() => (isC ? crmService.customer(id) : crmService.supplier(id)), [kind, id, version]);
  const p = profile.data;
  usePageTitle(p ? `CRM · ${isC ? (p as CustomerProfile).name : (p as SupplierProfile).company}` : "CRM");
  const toggle = useTaskToggle();
  const stage = useStageMover(() => undefined);

  const [comp, setComp] = useState<Composer>("note");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [outcome, setOutcome] = useState("Talked");
  const [minutes, setMinutes] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");

  if (!p) return <p className={k("loading")}>{profile.error ?? "Loading…"}</p>;

  const c = isC ? (p as CustomerProfile) : null;
  const s = isC ? null : (p as SupplierProfile);
  const name = c ? c.name : s!.company;
  const email = p.email;
  const base = isC ? "/admin/crm/customers" : "/admin/crm/suppliers";
  const history = p.history.filter((h) => filter === "all" || h.kind === filter);
  const openTickets = p.tickets.filter((t) => t.status !== "solved").length;
  const about = { kind, id, name };

  const focusComposer = (to: Composer) => {
    setComp(to);
    setTimeout(() => {
      document.getElementById("ctx")?.focus();
      document.getElementById("crm-comp")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  };

  const submit = async () => {
    if (text.trim().length < 2) {
      setError("Write something first");
      return;
    }
    setBusy(true);
    try {
      const input = { kind: comp, body: text.trim(), ...(comp === "email" ? { subject: subject.trim() || undefined } : {}), ...(comp === "call" ? { outcome, minutes: Number(minutes) || 0 } : {}) };
      await (isC ? crmService.addCustomerActivity(id, input) : crmService.addSupplierActivity(id, input));
      toast(comp === "note" ? "Note saved" : comp === "call" ? "Call logged" : "Email sent and logged");
      setText("");
      setSubject("");
      setError(null);
      changed();
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't save that."));
    } finally {
      setBusy(false);
    }
  };

  const setOwner = async (ownerId: string) => {
    try {
      await (isC ? crmService.updateCustomer(id, { ownerId: ownerId || null }) : crmService.updateSupplier(id, { ownerId: ownerId || null }));
      toast("Owner updated");
      changed();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't change the owner."), true);
    }
  };

  const toggleVip = async () => {
    if (!c) return;
    const manual = c.tags.filter((t) => meta.manualCustomerTags.includes(t));
    try {
      await crmService.updateCustomer(id, { tags: manual.includes("VIP") ? manual.filter((t) => t !== "VIP") : [...manual, "VIP"] });
      toast(manual.includes("VIP") ? "VIP removed" : "Marked as VIP");
      changed();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't update the tag."), true);
    }
  };

  const stageIdx = s ? meta.stages.findIndex((x) => x.key === s.stage) : -1;
  const lost = s?.stage === "lost";

  return (
    <>
      <nav className={k("crumb")} aria-label="Breadcrumb">
        <Link href={base}>{isC ? "Customers" : "Suppliers"}</Link>
        <CIcon name="right" />
        <span>{name}</span>
      </nav>
      <div className={k("phead")}>
        <CAv name={name} size="lg" />
        <div className={k("phm")}>
          <h1>{name}</h1>
          <div className={k("meta")}>
            <span>{isC ? "Customer" : "Supplier"}</span>
            <span className={k("mono")}>{p.code}</span>
            {c ? c.tags.length ? <span className={k("tags")}>{c.tags.map((t) => <Tag key={t} tag={t} />)}</span> : null : <StagePill stage={s!.stage} label={meta.stages.find((x) => x.key === s!.stage)?.label ?? s!.stage} />}
          </div>
          <div className={k("meta")}>
            {email ? (
              <button type="button" title="Write an email" onClick={() => focusComposer("email")}>
                <CIcon name="mail" />
                {email}
              </button>
            ) : null}
            {p.phone ? (
              <span>
                <CIcon name="phone" />
                {p.phone}
              </span>
            ) : null}
            {s?.contact ? (
              <span>
                <CIcon name="users" />
                {s.contact}
              </span>
            ) : null}
            {p.location ? (
              <span>
                <CIcon name="pin" />
                {p.location}
              </span>
            ) : null}
          </div>
        </div>
        <div className={k("pact")}>
          <button type="button" className={k("btn sec")} onClick={() => focusComposer("call")}>
            <CIcon name="phone" />
            Log call
          </button>
          <button type="button" className={k("btn sec")} onClick={() => open("ticket", { about })}>
            <CIcon name="inbox" />
            New ticket
          </button>
        </div>
      </div>

      {s ? (
        <div className={`${k("card")} ${k("stage-card")}`}>
          <div className={k(`steps ${lost ? "lost" : ""}`)} role="list" aria-label="Pipeline stage">
            {meta.stages
              .filter((x) => x.key !== "lost")
              .map((x, i) => (
                <button
                  key={x.key}
                  type="button"
                  role="listitem"
                  className={k(`stp ${lost ? "" : i < stageIdx ? "done" : i === stageIdx ? "now" : ""}`)}
                  aria-current={s.stage === x.key ? "step" : undefined}
                  title={`${x.description}${s.stage === x.key ? "" : " · Move here"}`}
                  onClick={() => stage.move({ id, company: s.company, stage: s.stage }, x.key)}
                >
                  {x.label}
                </button>
              ))}
          </div>
          {lost ? (
            <span className={k("tag bad")}>Lost</span>
          ) : (
            <button type="button" className={k("btn ghost sm t-bad")} onClick={() => stage.move({ id, company: s.company, stage: s.stage }, "lost")}>
              Mark as lost
            </button>
          )}
        </div>
      ) : null}

      <div className={k("det")}>
        <div className={k("stack")}>
          <section className={k("card")} aria-label="Log activity" id="crm-comp">
            <form
              className={k("comp")}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className={k("comp-h")}>
                <div className={k("seg")} role="tablist" aria-label="Activity type">
                  {(
                    [
                      ["note", "note", "Note"],
                      ["call", "phone", "Call"],
                      ["email", "mail", "Email"],
                    ] as Array<[Composer, string, string]>
                  ).map(([key, icon, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={comp === key} onClick={() => setComp(key)}>
                      <CIcon name={icon} />
                      {label}
                    </button>
                  ))}
                </div>
                <span className={k("help")}>{comp === "note" ? "Only our team sees notes" : comp === "call" ? "Saved to the activity history" : "Sent by email and logged here"}</span>
              </div>
              {comp === "email" ? (
                <label className={k("field")} htmlFor="esub">
                  <span className={k("sr")}>Subject</span>
                  <input className={k("inp")} id="esub" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </label>
              ) : null}
              {comp === "call" ? (
                <div className={k("fg2")}>
                  <label className={k("field")} htmlFor="cout">
                    <span className={k("lab")}>Outcome</span>
                    <select className={k("inp")} id="cout" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                      {meta.callOutcomes.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className={k("field")} htmlFor="cdur">
                    <span className={k("lab")}>Minutes</span>
                    <input className={k("inp")} id="cdur" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </label>
                </div>
              ) : null}
              <label className={k("sr")} htmlFor="ctx">
                {comp === "note" ? "Note" : comp === "call" ? "Call summary" : "Message"}
              </label>
              <textarea
                className={k("inp")}
                id="ctx"
                rows={3}
                value={text}
                aria-invalid={error ? true : undefined}
                placeholder={comp === "note" ? "Add a note, e.g. prefers email, met at trade show…" : comp === "call" ? "What did you talk about?" : "Write your message…"}
                onChange={(e) => setText(e.target.value)}
              />
              <ErrText>{error}</ErrText>
              <div className={k("comp-f")}>
                <button type="submit" className={k("btn pri sm")} disabled={busy}>
                  {comp === "note" ? "Save note" : comp === "call" ? "Log call" : "Send email"}
                </button>
              </div>
            </form>
          </section>

          <section className={k("card")} aria-labelledby="hH">
            <div className={k("card-h")}>
              <h2 id="hH">Activity</h2>
              <label className={k("sr")} htmlFor="hf">
                Show
              </label>
              <select className={k("inp fsel")} id="hf" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All activity</option>
                <option value="note">Notes</option>
                <option value="call">Calls</option>
                <option value="email">Emails</option>
                <option value="ticket">Tickets</option>
                {isC ? <option value="order">Orders</option> : <option value="stage">Stage changes</option>}
              </select>
            </div>
            {history.length ? (
              <ol className={k("tl")}>
                {history.map((h) => (
                  <HistoryRow key={h.id} h={h} />
                ))}
              </ol>
            ) : (
              <p className={k("empty")}>Nothing here yet.</p>
            )}
          </section>
        </div>

        <div className={k("stack")}>
          <section className={k("card")}>
            <div className={k("card-h")}>
              <h2>Details</h2>
            </div>
            <div className={k("card-b")}>
              <dl className={k("kv")}>
                {c ? (
                  <>
                    <dt>Customer since</dt>
                    <dd>{fmtD(c.since)}</dd>
                    <dt>Orders</dt>
                    <dd className={k("num")}>{c.orders}</dd>
                    <dt>Lifetime spend</dt>
                    <dd className={k("num")}>{money(c.ltv)}</dd>
                    <dt>Average order</dt>
                    <dd className={k("num")}>{c.averageOrder !== null ? money(c.averageOrder) : "—"}</dd>
                    <dt>Last order</dt>
                    <dd>{c.lastOrderAt ? rel(c.lastOrderAt) : "—"}</dd>
                    <dt>Marketing emails</dt>
                    <dd>{c.marketingConsent ? <span className={k("t-ok")}>Subscribed</span> : <span className={k("muted")}>Not subscribed</span>}</dd>
                    <dt>VIP</dt>
                    <dd>
                      <button type="button" className={k("btn sec sm")} onClick={toggleVip}>
                        {c.tags.includes("VIP") ? "Remove VIP" : "Mark as VIP"}
                      </button>
                    </dd>
                  </>
                ) : (
                  <>
                    <dt>Category</dt>
                    <dd>{s!.category ?? "—"}</dd>
                    <dt>Source</dt>
                    <dd>{s!.source}</dd>
                    <dt>Est. products</dt>
                    <dd className={k("num")}>~{s!.estProducts}</dd>
                    <dt>Live products</dt>
                    <dd className={k("num")}>{s!.liveProducts}</dd>
                    <dt>In this stage</dt>
                    <dd>{Math.round((Date.now() - new Date(s!.stageChangedAt).getTime()) / DAY)} days</dd>
                    {lost ? (
                      <>
                        <dt>Lost because</dt>
                        <dd>{s!.lostReason}</dd>
                      </>
                    ) : null}
                  </>
                )}
                <dt>
                  <label htmlFor="own">Owner</label>
                </dt>
                <dd>
                  <select className={k("inp sm")} id="own" value={p.owner?.id ?? ""} onChange={(e) => setOwner(e.target.value)}>
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </dd>
              </dl>
              {s?.application ? (
                <Link className={k("btn sec sm block")} style={{ marginTop: 14 }} href={`/admin/seller-applications/${s.application.id}`}>
                  Open application {s.application.reference} <CIcon name="arrow" />
                </Link>
              ) : null}
              {c && c.recentOrders.length ? (
                <div style={{ marginTop: 14 }}>
                  <p className={k("help")} style={{ marginBottom: 6 }}>
                    Recent orders
                  </p>
                  <ul className={k("rows")}>
                    {c.recentOrders.map((o) => (
                      <li key={o.orderNumber}>
                        <Link className={k("row-a")} style={{ padding: "8px 0" }} href={`/admin/orders?id=${o.id}`}>
                          <span className={k("row-m")}>
                            <b>#{o.orderNumber}</b>
                            <small>
                              {fmtD(o.createdAt)} · {o.status.replace(/_/g, " ").toLowerCase()}
                            </small>
                          </span>
                          <span className={k("num")}>{money(o.total)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {c && !c.hasAccount ? (
                <p className={k("help")} style={{ marginTop: 12 }}>
                  No account yet: added by hand. Orders appear here if they sign up with this email.
                </p>
              ) : null}
            </div>
          </section>

          {s && s.stage !== "live" && s.stage !== "lost" ? <NextStep key={`${s.nextStep}|${s.nextDue}`} s={s} onSaved={changed} /> : null}

          <section className={k("card")}>
            <div className={k("card-h")}>
              <h2>Tickets</h2>
              <span className={k("sub")}>{openTickets} open</span>
            </div>
            {p.tickets.length ? (
              <ul className={k("rows")}>
                {p.tickets.map((t) => (
                  <li key={t.reference}>
                    <Link className={k("row-a")} href={`/admin/crm/tickets?ref=${t.reference}`}>
                      <span className={k("row-m")}>
                        <b>{t.subject}</b>
                        <small>
                          {t.reference} · {rel(t.createdAt)}
                        </small>
                      </span>
                      <span className={k(`st ${t.status === "open" ? "sd-applied" : t.status === "solved" ? "sd-live" : ""}`)}>{{ open: "Open", pending: "Waiting", solved: "Solved" }[t.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={k("empty-s")}>No tickets.</p>
            )}
          </section>

          <section className={k("card")}>
            <div className={k("card-h")}>
              <h2>Tasks</h2>
              <button type="button" className={k("btn ghost sm")} onClick={() => open("task", { about })}>
                <CIcon name="plus" />
                Add
              </button>
            </div>
            {p.tasks.length ? (
              <ul className={k("rows")}>
                {p.tasks.map((t) => (
                  <TaskItem key={t.id} t={t} onToggle={toggle} />
                ))}
              </ul>
            ) : (
              <p className={k("empty-s")}>No tasks.</p>
            )}
          </section>
        </div>
      </div>
      {stage.dialogs}
    </>
  );
}

function HistoryRow({ h }: { h: HistoryItem }) {
  const kind = h.kind as ActivityKind;
  return (
    <li className={k(kind)}>
      <span className={k("fi")}>
        <CIcon name={ICON[kind] ?? "doc"} />
      </span>
      <div className={k("row-m")}>
        <p>{h.body}</p>
        <small>
          {KIND_LABEL[kind] ?? "Activity"} · {h.by ?? "System"} · <time title={tfmt(h.at)}>{rel(h.at)}</time>
        </small>
      </div>
    </li>
  );
}

/** The supplier's next step and when it is due: shown, or edited (always editable while there is none). */
function NextStep({ s, onSaved }: { s: SupplierProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(s.nextStep ?? "");
  const [due, setDue] = useState(s.nextDue ? s.nextDue.slice(0, 10) : "");
  const showForm = editing || !s.nextStep;
  const [text, tone] = s.nextDue ? dueTxt(s.nextDue) : ["", "" as const];

  const save = async () => {
    try {
      await crmService.updateSupplier(s.id, { nextStep: step.trim(), nextDue: due ? new Date(`${due}T12:00:00`).toISOString() : null });
      toast("Next step saved");
      setEditing(false);
      onSaved();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't save the next step."), true);
    }
  };

  return (
    <section className={k("card")}>
      <div className={k("card-h")}>
        <h2>Next step</h2>
        {!showForm ? (
          <button type="button" className={k("btn ghost sm")} onClick={() => setEditing(true)}>
            Edit
          </button>
        ) : null}
      </div>
      <div className={k("card-b")}>
        {!showForm ? (
          <>
            <p>{s.nextStep}</p>
            {s.nextDue ? (
              <p className={k(toneC(tone))} style={{ fontSize: 13, marginTop: 2 }}>
                {text === "Today" || text === "Tomorrow" ? "Due " : ""}
                {text}
              </p>
            ) : null}
          </>
        ) : (
          <form
            className={k("stack")}
            style={{ gap: 12 }}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label className={k("field")} htmlFor="nst">
              <span className={k("lab")}>What{"’"}s next?</span>
              <input className={k("inp")} id="nst" value={step} onChange={(e) => setStep(e.target.value)} />
            </label>
            <label className={k("field")} htmlFor="nsd">
              <span className={k("lab")}>By</span>
              <input className={k("inp")} type="date" id="nsd" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <div className={k("comp-f")} style={{ gap: 8 }}>
              {s.nextStep ? (
                <button type="button" className={k("btn ghost sm")} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              ) : null}
              <button type="submit" className={k("btn pri sm")}>
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
