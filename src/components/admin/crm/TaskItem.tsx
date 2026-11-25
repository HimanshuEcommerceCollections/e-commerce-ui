"use client";
import Link from "next/link";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/components/admin/ui";
import { useCrm } from "./CrmContext";
import { dueTxt, k, toneC } from "./ui";

/** What a task row needs; the contact is shown on the dashboard, not on that contact's own page. */
export interface TaskLike {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  contact?: { kind: "customer" | "supplier"; id: string; name: string } | null;
}

/** Ticks a task off (or back on) and tells the rest of the CRM. */
export function useTaskToggle() {
  const { changed } = useCrm();
  return async (t: { id: string }, done: boolean) => {
    try {
      await crmService.updateTask(t.id, { done });
      toast(done ? "Task done" : "Task reopened");
      changed();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't update the task."), true);
    }
  };
}

export function TaskItem({ t, onToggle }: { t: TaskLike; onToggle: (t: TaskLike, done: boolean) => void }) {
  const [text, tone] = dueTxt(t.dueAt);
  const href = t.contact ? `/admin/crm/${t.contact.kind === "customer" ? "customers" : "suppliers"}/${t.contact.id}` : null;
  return (
    <li className={k(`task ${t.done ? "done" : ""}`)}>
      <input type="checkbox" id={`tk-${t.id}`} checked={t.done} onChange={(e) => onToggle(t, e.target.checked)} />
      <label className={k("tt")} htmlFor={`tk-${t.id}`}>
        {t.title}
      </label>
      <span className={k("tm")}>
        {t.contact && href ? <Link href={href}>{t.contact.name}</Link> : null}
        <span className={k(t.done ? "muted" : toneC(tone))}>{t.done ? "Done" : text}</span>
      </span>
    </li>
  );
}
