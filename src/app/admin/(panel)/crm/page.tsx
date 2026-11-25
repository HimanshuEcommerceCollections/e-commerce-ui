"use client";
import { useState } from "react";
import Link from "next/link";
import crmService from "@/services/admin/crm.service";
import { usePageTitle } from "@/components/admin/ui";
import { useCrm } from "@/components/admin/crm/CrmContext";
import { useLoad } from "@/components/admin/crm/useLoad";
import { TaskItem, useTaskToggle } from "@/components/admin/crm/TaskItem";
import { Av, CAv, CIcon, Tag, k, money, priDot, rel, slaTxt, toneC } from "@/components/admin/crm/ui";
import type { CrmDashboard, TaskTab } from "@/types/api/crm.types";

const ACTIVITY_ICON: Record<string, string> = { note: "note", call: "phone", email: "mail", ticket: "inbox", order: "cart", stage: "kanban", task: "check" };

/** The CRM dashboard: what needs the signed-in teammate's attention today. */
export default function CrmDashboardPage() {
  usePageTitle("CRM");
  const { members, me, version, open, meta } = useCrm();
  const [taskTab, setTaskTab] = useState<TaskTab>("today");
  const [teamTab, setTeamTab] = useState<"activity" | "load">("activity");
  const dash = useLoad(() => crmService.dashboard(), [version]);
  const tasks = useLoad(() => crmService.tasks({ owner: "me", tab: taskTab }), [taskTab, version]);

  const name = members.find((m) => m.id === me)?.name.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const d = dash.data;

  const toggle = useTaskToggle();

  return (
    <>
      <div className={k("ph")}>
        <div>
          <h1>
            {hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, {name}
          </h1>
          <p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Here{"’"}s what needs your attention today.</p>
        </div>
      </div>

      {dash.error && !d ? <p className={k("empty")}>{dash.error}</p> : null}
      {d ? <Kpis d={d} stuckDays={meta.stuckDays} /> : <p className={k("loading")}>Loading…</p>}

      {d ? (
        <div className={k("dg")}>
          <section className={`${k("card s7")}`} id="tasks" aria-labelledby="tH">
            <div className={k("card-h")}>
              <h2 id="tH">My tasks</h2>
              <div className={k("seg")} role="tablist" aria-label="Task filter">
                {(
                  [
                    ["today", "Today & overdue"],
                    ["up", "Upcoming"],
                    ["done", "Done"],
                  ] as Array<[TaskTab, string]>
                ).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={taskTab === key} onClick={() => setTaskTab(key)}>
                    {label}
                    <span className={k("c")}>{tasks.data?.counts[key] ?? ""}</span>
                  </button>
                ))}
              </div>
              <button type="button" className={k("btn ghost icon sm")} aria-label="Add task" title="Add task" onClick={() => open("task")}>
                <CIcon name="plus" />
              </button>
            </div>
            {tasks.data && tasks.data.content.length ? (
              <ul className={k("rows")}>
                {tasks.data.content.map((t) => (
                  <TaskItem key={t.id} t={t} onToggle={toggle} />
                ))}
              </ul>
            ) : (
              <p className={k("empty")}>{tasks.data ? (taskTab === "today" ? "Nothing due today." : "Nothing here.") : "Loading…"}</p>
            )}
          </section>

          <section className={k("card s5")} aria-labelledby="qH">
            <div className={k("card-h")}>
              <h2 id="qH">Answer first</h2>
              <Link className={k("lnk")} href="/admin/crm/tickets">
                All tickets <CIcon name="right" />
              </Link>
            </div>
            <ul className={k("rows")}>
              {d.queue.length ? (
                d.queue.map((t) => {
                  const [s, tone] = slaTxt(t);
                  return (
                    <li key={t.id}>
                      <Link className={k("row-a")} href={`/admin/crm/tickets?ref=${t.reference}`}>
                        <span className={k(`pri-d ${priDot(t.priority)}`)} title={`${t.priority} priority`} />
                        <span className={k("row-m")}>
                          <b>{t.subject}</b>
                          <small>
                            {t.requester.name} · {t.requester.kind === "supplier" ? "Supplier" : "Customer"}
                          </small>
                        </span>
                        <span className={k("row-r")}>
                          <span className={k(toneC(tone))}>{s}</span>
                          <Av member={t.owner} size="xs" />
                        </span>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className={k("empty")}>No open tickets.</li>
              )}
            </ul>
          </section>

          <section className={k("card s7")} aria-labelledby="fH">
            <div className={k("card-h")}>
              <h2 id="fH">Supplier pipeline</h2>
              <Link className={k("lnk")} href="/admin/crm/suppliers">
                Open board <CIcon name="right" />
              </Link>
            </div>
            <ul className={k("fun")} aria-label="Suppliers per stage">
              {d.funnel.map((f) => (
                <li key={f.key}>
                  <Link href={`/admin/crm/suppliers?stage=${f.key}`}>
                    <span className={k("fl")}>{f.label}</span>
                    <span className={k("fb")} aria-hidden="true">
                      <i className={f.key === "live" ? k("live") : ""} style={{ width: `${(f.count / Math.max(...d.funnel.map((x) => x.count), 1)) * 100}%` }} />
                    </span>
                    <b className={k("num")}>{f.count}</b>
                  </Link>
                </li>
              ))}
            </ul>
            {d.stuckSuppliers.length ? (
              <div style={{ padding: "0 18px 16px" }}>
                <p className={k("callout")}>
                  <CIcon name="clock" />
                  <span>
                    <b>{d.stuckSuppliers.length}</b> {d.stuckSuppliers.length > 1 ? "suppliers have" : "supplier has"} been in the same stage for {meta.stuckDays}+ days:{" "}
                    {d.stuckSuppliers.map((s, i) => (
                      <span key={s.id}>
                        {i ? ", " : ""}
                        <Link href={`/admin/crm/suppliers/${s.id}`}>{s.company}</Link>
                      </span>
                    ))}
                  </span>
                </p>
              </div>
            ) : null}
          </section>

          <section className={k("card s5")} aria-labelledby="cH">
            <div className={k("card-h")}>
              <h2 id="cH">Customers to look after</h2>
              <span className={k("sub")}>At risk, or VIP with an open ticket</span>
            </div>
            <ul className={k("rows")}>
              {d.care.length ? (
                d.care.map((c) => (
                  <li key={c.id}>
                    <Link className={k("row-a")} href={`/admin/crm/customers/${c.id}`}>
                      <CAv name={c.name} size="sm" />
                      <span className={k("row-m")}>
                        <b>{c.name}</b>
                        <small>
                          {c.tags.includes("At risk") ? `No order for ${c.daysSinceOrder ?? "?"} days` : `${c.openTickets} open ticket${c.openTickets === 1 ? "" : "s"}`} · {money(c.ltv)} lifetime
                        </small>
                      </span>
                      <span className={k("tags")}>
                        {c.tags
                          .filter((t) => t === "VIP" || t === "At risk")
                          .map((t) => (
                            <Tag key={t} tag={t} />
                          ))}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className={k("empty")}>Nobody needs attention.</li>
              )}
            </ul>
          </section>

          <section className={k("card s12")} aria-labelledby="aH">
            <div className={k("card-h")}>
              <h2 id="aH">Team</h2>
              <div className={k("seg")} role="tablist" aria-label="Team view">
                {(
                  [
                    ["activity", "Recent activity"],
                    ["load", "Workload"],
                  ] as const
                ).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={teamTab === key} onClick={() => setTeamTab(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {teamTab === "activity" ? (
              d.activity.length ? (
                <ol className={`${k("rows")} ${k("feed")}`}>
                  {d.activity.map((a) => (
                    <li key={a.id}>
                      <span className={k("fi")}>
                        <CIcon name={ACTIVITY_ICON[a.kind] ?? "doc"} />
                      </span>
                      <div className={k("row-m")}>
                        <p>
                          {a.subject ? <Link href={`/admin/crm/${a.subject.kind === "customer" ? "customers" : "suppliers"}/${a.subject.id}`}>{a.subject.name}</Link> : null} · {a.body}
                        </p>
                        <small>
                          {a.by ?? "System"} · {rel(a.at)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={k("empty")}>No activity yet.</p>
              )
            ) : (
              <div className={k("tw")}>
                <table className={k("tbl")}>
                  <thead>
                    <tr>
                      <th>Teammate</th>
                      <th className={k("r")}>Open tickets</th>
                      <th className={k("r")}>Open tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.workload.map((w) => (
                      <tr key={w.member.id}>
                        <td>
                          <span className={k("nm")}>
                            <Av member={w.member} size="sm" />
                            <span>
                              <b>{w.member.name}</b>
                              <small>{w.member.role}</small>
                            </span>
                          </span>
                        </td>
                        <td className={k("r num")}>{w.openTickets}</td>
                        <td className={k("r num")}>{w.openTasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

function Kpis({ d, stuckDays }: { d: CrmDashboard; stuckDays: number }) {
  const kp = d.kpis;
  return (
    <div className={k("kpis")}>
      <Link className={k("kpi")} href="/admin/crm/tickets">
        <p className={k("k")}>Open tickets</p>
        <p className={k("v num")}>{kp.openTickets}</p>
        <p className={k("s")}>{kp.unassignedTickets} unassigned</p>
      </Link>
      <Link className={k("kpi")} href="/admin/crm/tickets?view=overdue">
        <p className={k("k")}>Past reply time</p>
        <p className={k("v num")}>{kp.overdueTickets}</p>
        <p className={k(`s ${kp.overdueTickets ? "t-bad" : "t-ok"}`)}>{kp.overdueTickets ? "Needs a reply now" : "All within target"}</p>
      </Link>
      <a className={k("kpi")} href="#tasks">
        <p className={k("k")}>My tasks due</p>
        <p className={k("v num")}>{kp.myTasksDue}</p>
        <p className={k(`s ${kp.myTasksOverdue ? "t-bad" : ""}`)}>{kp.myTasksOverdue ? `${kp.myTasksOverdue} overdue` : "None overdue"}</p>
      </a>
      <Link className={k("kpi")} href="/admin/crm/suppliers">
        <p className={k("k")}>Suppliers in progress</p>
        <p className={k("v num")}>{kp.suppliersInProgress}</p>
        <p className={k("s")}>
          {kp.liveSuppliers} live · {kp.stuckSuppliers} stuck {stuckDays}+ days
        </p>
      </Link>
    </div>
  );
}

