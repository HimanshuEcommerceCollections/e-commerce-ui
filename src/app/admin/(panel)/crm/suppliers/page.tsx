"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import crmService from "@/services/admin/crm.service";
import { useDebounced, usePageTitle } from "@/components/admin/ui";
import { useCrm } from "@/components/admin/crm/CrmContext";
import { MoveDialog } from "@/components/admin/crm/dialogs";
import { useStageMover } from "@/components/admin/crm/stageMove";
import { useLoad } from "@/components/admin/crm/useLoad";
import { Av, CAv, CIcon, DAY, StagePill, dueTxt, k, toneC } from "@/components/admin/crm/ui";
import type { PipelineStage, SupplierRow } from "@/types/api/crm.types";

const daysIn = (s: SupplierRow) => Math.round((Date.now() - new Date(s.stageChangedAt).getTime()) / DAY);

export default function CrmSuppliersPage() {
  return (
    <Suspense fallback={<p className={k("loading")}>Loading…</p>}>
      <Suppliers />
    </Suspense>
  );
}

/** From first contact to selling on the marketplace. Drag a card to change its stage. */
function Suppliers() {
  usePageTitle("CRM · Suppliers");
  const router = useRouter();
  const flash = useSearchParams().get("stage");
  const { meta, members, version, open } = useCrm();
  const [view, setView] = useState<"board" | "list">("board");
  const [text, setText] = useState("");
  const q = useDebounced(text.trim(), 250);
  const [owner, setOwner] = useState("");
  const [lost, setLost] = useState(false);
  const [moving, setMoving] = useState<SupplierRow | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const board = useLoad(() => crmService.suppliers({ q: q || undefined, owner: owner || undefined, includeLost: lost }), [q, owner, lost, version]);
  const stage = useStageMover(() => board.reload());
  const d = board.data;
  const cols = meta.stages.filter((s) => s.key !== "lost" || lost);
  const stuckDays = meta.stuckDays;

  // The dashboard's funnel links here with ?stage=: show the board and bring that column into view.
  const flashRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (flash && d) {
      setView("board");
      flashRef.current?.scrollIntoView({ inline: "start", block: "nearest" });
    }
  }, [flash, d]);

  const dropOn = (key: PipelineStage, id: string) => {
    const s = d?.content.find((x) => x.id === id);
    if (s) stage.move({ id: s.id, company: s.company, stage: s.stage }, key);
  };

  return (
    <>
      <div className={k("ph")}>
        <div>
          <h1>Suppliers</h1>
          <p>From first contact to selling on the marketplace. Drag a card to change its stage.</p>
        </div>
        <button type="button" className={k("btn pri")} onClick={() => open("lead")}>
          <CIcon name="plus" />
          Add lead
        </button>
      </div>

      <div className={k("strip")}>
        <div>
          <b className={k("num")}>{d?.strip.inProgress ?? "–"}</b>
          <span>In progress</span>
        </div>
        <div>
          <b className={k("num")}>~{d?.strip.productsOnTheWay ?? "–"}</b>
          <span>Products on the way</span>
        </div>
        <div>
          <b className={k("num")}>{d?.strip.live ?? "–"}</b>
          <span>Live suppliers</span>
        </div>
        <div>
          <b className={k(`num ${d?.strip.overdueNextSteps ? "t-bad" : ""}`)}>{d?.strip.overdueNextSteps ?? "–"}</b>
          <span>Overdue next steps</span>
        </div>
      </div>

      <div className={k("tools bare")}>
        <div className={k("seg")} role="tablist" aria-label="View">
          {(
            [
              ["board", "kanban", "Board"],
              ["list", "list", "List"],
            ] as const
          ).map(([key, icon, label]) => (
            <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}>
              <CIcon name={icon} />
              {label}
            </button>
          ))}
        </div>
        <label className={k("srch")}>
          <CIcon name="search" />
          <span className={k("sr")}>Search suppliers</span>
          <input placeholder="Company, person or category" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className={k("sr")} htmlFor="fo">
          Owner
        </label>
        <select className={k("inp fsel")} id="fo" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Any owner</option>
          <option value="none">No owner</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className={k("check-s grow")}>
          <input type="checkbox" checked={lost} onChange={(e) => setLost(e.target.checked)} /> Show lost ({d?.strip.lost ?? 0})
        </label>
      </div>

      {board.error && !d ? <p className={k("empty")}>{board.error}</p> : null}
      {!d && !board.error ? <p className={k("loading")}>Loading…</p> : null}

      {d && view === "board" ? (
        <div className={k("board")}>
          {cols.map((col) => {
            const cards = d.content.filter((s) => s.stage === col.key);
            return (
              <section
                key={col.key}
                ref={col.key === flash ? (el) => void (flashRef.current = el) : undefined}
                className={k(`col ${over === col.key ? "over" : ""} ${flash === col.key ? "flash" : ""}`)}
                aria-labelledby={`h-${col.key}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(col.key);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  dropOn(col.key, e.dataTransfer.getData("text/plain"));
                }}
              >
                <header className={k("colh")}>
                  <span className={k(`cdot st-${col.key}`)} />
                  <h2 id={`h-${col.key}`}>{col.label}</h2>
                  <span className={k("cn")}>{cards.length}</span>
                  <span className={k("auto")} tabIndex={0} title={col.auto ? `${col.description} · updates from the Seller Portal` : col.description} aria-label={col.auto ? `${col.description}. Updates automatically` : col.description}>
                    <CIcon name={col.auto ? "sync" : "info"} />
                  </span>
                </header>
                <ul className={k("cards")}>
                  {cards.length ? cards.map((s) => <Card key={s.id} s={s} stuckDays={stuckDays} onMove={() => setMoving(s)} />) : <li className={k("ce")}>Drop a supplier here</li>}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}

      {d && view === "list" ? (
        <div className={k("card")}>
          <div className={k("tw")}>
            <table className={k("tbl resp")}>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th className={k("c-d")}>Category</th>
                  <th className={k("c-d")}>Stage</th>
                  <th className={k("r c-d")}>Products</th>
                  <th className={k("c-d")}>Next step</th>
                  <th className={k("r c-d")}>In stage</th>
                  <th className={k("c-own")}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {[...d.content]
                  .sort((a, b) => meta.stages.findIndex((x) => x.key === a.stage) - meta.stages.findIndex((x) => x.key === b.stage) || (a.nextDue ? new Date(a.nextDue).getTime() : 9e15) - (b.nextDue ? new Date(b.nextDue).getTime() : 9e15))
                  .map((s) => {
                    const [due, tone] = s.nextDue ? dueTxt(s.nextDue) : ["", "" as const];
                    const days = daysIn(s);
                    const stale = days > stuckDays && s.stage !== "live" && s.stage !== "lost";
                    const label = meta.stages.find((x) => x.key === s.stage)?.label ?? s.stage;
                    const next = s.nextStep ? (
                      <>
                        <span>{s.nextStep}</span> <span className={k(toneC(tone))} style={{ fontSize: 12 }}>· {due}</span>
                      </>
                    ) : s.stage === "lost" ? (
                      <span className={k("muted")}>{s.lostReason}</span>
                    ) : (
                      <span className={k("faint")}>—</span>
                    );
                    return (
                      <tr key={s.id} data-go={s.id} onClick={(e) => !(e.target as HTMLElement).closest("a") && router.push(`/admin/crm/suppliers/${s.id}`)}>
                        <td className={k("c-main")}>
                          <Link href={`/admin/crm/suppliers/${s.id}`} className={k("nm")}>
                            <CAv name={s.company} size="sm" />
                            <span>
                              <b>{s.company}</b>
                              <small>{s.contact ?? ""}</small>
                            </span>
                          </Link>
                        </td>
                        <td className={k("c-d muted")}>{s.category ?? "—"}</td>
                        <td className={k("c-d")}>
                          <StagePill stage={s.stage} label={label} />
                        </td>
                        <td className={k("r num c-d")}>{s.stage === "live" ? `${s.liveProducts} live` : `~${s.estProducts}`}</td>
                        <td className={k("c-d")}>{next}</td>
                        <td className={k(`r num c-d ${stale ? "t-warn" : "muted"}`)}>{days}d</td>
                        <td className={k("c-own")}>
                          <Av member={s.owner} size="xs" />
                        </td>
                        <td className={k("c-mob")}>
                          <StagePill stage={s.stage} label={label} />
                          <span>· {next}</span>
                        </td>
                      </tr>
                    );
                  })}
                {!d.content.length ? (
                  <tr>
                    <td colSpan={7} className={k("empty")}>
                      No suppliers match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {moving ? (
        <MoveDialog
          open
          company={moving.company}
          current={moving.stage}
          onClose={() => setMoving(null)}
          onMove={(to) => {
            const s = moving;
            setMoving(null);
            stage.move({ id: s.id, company: s.company, stage: s.stage }, to);
          }}
        />
      ) : null}
      {stage.dialogs}
    </>
  );
}

function Card({ s, stuckDays, onMove }: { s: SupplierRow; stuckDays: number; onMove: () => void }) {
  const days = daysIn(s);
  const [due, tone] = s.nextDue ? dueTxt(s.nextDue) : ["", "" as const];
  const stale = days > stuckDays && s.stage !== "live" && s.stage !== "lost";
  return (
    <li className={k("kc")} draggable onDragStart={(e) => {
      e.dataTransfer.setData("text/plain", s.id);
      e.dataTransfer.effectAllowed = "move";
    }}>
      <Link className={k("kt")} href={`/admin/crm/suppliers/${s.id}`} draggable={false}>
        <b>{s.company}</b>
        <small>
          {s.category ?? "—"} · {s.stage === "live" ? `${s.liveProducts} live products` : `~${s.estProducts} products`}
        </small>
      </Link>
      {s.nextStep ? (
        <div className={k("kn")}>
          <CIcon name="arrow" />
          <span className={k("kn-t")} title={s.nextStep}>
            {s.nextStep}
          </span>
          <span className={k(toneC(tone))}>{due}</span>
        </div>
      ) : s.stage === "lost" ? (
        <div className={k("kn muted")}>{s.lostReason}</div>
      ) : null}
      <div className={k("kf")}>
        <Av member={s.owner} size="xs" />
        <span className={k(`kd ${stale ? "t-warn fw" : ""}`)} title="Days in this stage">
          <CIcon name="clock" />
          {days}d in stage
        </span>
        <button type="button" className={k("btn ghost icon sm km")} aria-label={`Move ${s.company} to another stage`} title="Move to stage" onClick={onMove}>
          <CIcon name="more" />
        </button>
      </div>
    </li>
  );
}
