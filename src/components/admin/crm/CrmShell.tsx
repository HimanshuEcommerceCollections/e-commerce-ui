"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { refreshAdminCounts } from "@/components/admin/refresh";
import { useDebounced } from "@/components/admin/ui";
import type { CrmMember, CrmMeta, CrmNotification, CrmSearchResult } from "@/types/api/crm.types";
import { CrmContext, type DialogKind, type OpenOptions } from "./CrmContext";
import { CrmDialogs, type DialogRequest } from "./dialogs";
import { CAv, CIcon, k } from "./ui";

const TABS: Array<[string, string, string]> = [
  ["/admin/crm", "Dashboard", "grid"],
  ["/admin/crm/tickets", "Tickets", "inbox"],
  ["/admin/crm/customers", "Customers", "users"],
  ["/admin/crm/suppliers", "Suppliers", "truck"],
];

export const hrefFor = (link: CrmNotification["link"]) =>
  link.type === "ticket"
    ? `/admin/crm/tickets?ref=${link.id}`
    : link.type === "customer"
      ? `/admin/crm/customers/${link.id}`
      : link.type === "supplier"
        ? `/admin/crm/suppliers/${link.id}`
        : "/admin/crm#tasks";

const seenIds = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem("crm-seen") ?? "[]");
  } catch {
    return [];
  }
};

/**
 * The CRM's frame inside the admin portal: its own navigation, search,
 * notifications and the Create menu. Loads the team and vocabulary once.
 */
export default function CrmShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [boot, setBoot] = useState<{ meta: CrmMeta; members: CrmMember[]; me: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const nonce = useRef(0);

  useEffect(() => {
    let live = true;
    Promise.all([crmService.meta(), crmService.team()])
      .then(([meta, team]) => live && setBoot({ meta, members: team.members, me: team.me }))
      .catch((e) => live && setError(getApiErrorMessage(e, "Couldn't open the CRM.")));
    return () => {
      live = false;
    };
  }, []);

  const changed = useCallback(() => {
    setVersion((v) => v + 1);
    refreshAdminCounts();
  }, []);
  const open = useCallback((kind: DialogKind, options: OpenOptions = {}) => {
    nonce.current += 1;
    setRequest({ kind, options, nonce: nonce.current });
  }, []);

  // C opens the Create menu, / jumps to search (when not typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (/INPUT|TEXTAREA|SELECT/.test(el?.tagName ?? "") || el?.isContentEditable || document.querySelector("dialog[open]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("crm-gq")?.focus();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        open("create");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const ctx = useMemo(() => (boot ? { ...boot, version, changed, open } : null), [boot, version, changed, open]);

  if (error) {
    return (
      <div className={k("root")}>
        <p className={k("empty")}>{error}</p>
      </div>
    );
  }
  if (!ctx) {
    return (
      <div className={k("root")}>
        <p className={k("empty")}>Loading…</p>
      </div>
    );
  }

  return (
    <CrmContext.Provider value={ctx}>
      <div className={k("root")}>
        <div className={k("bar")}>
          <nav className={k("tabs")} aria-label="CRM sections">
            {TABS.map(([href, label, icon]) => {
              const here = href === "/admin/crm" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} aria-current={here ? "page" : undefined}>
                  <CIcon name={icon} />
                  {label}
                  {href === "/admin/crm/tickets" ? <OpenBadge version={version} /> : null}
                </Link>
              );
            })}
          </nav>
          <GlobalSearch onGo={(href) => router.push(href)} />
          <div className={k("right")}>
            <Bell version={version} onGo={(href) => router.push(href)} />
            <button type="button" className={k("btn pri sm")} onClick={() => open("create")}>
              <CIcon name="plus" />
              Create
              <kbd>C</kbd>
            </button>
          </div>
        </div>
        {children}
        <CrmDialogs
          request={request}
          onClose={() => setRequest(null)}
          onSaved={(created, options) => {
            setRequest(null);
            changed();
            options.onDone?.(created);
          }}
        />
      </div>
    </CrmContext.Provider>
  );
}

/** Open tickets, beside "Tickets". */
function OpenBadge({ version }: { version: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    crmService
      .summary()
      .then((s) => setN(s.tickets.open))
      .catch(() => undefined);
  }, [version]);
  return n ? (
    <span className={k("n")} aria-label={`${n} open`}>
      {n}
    </span>
  ) : null;
}

function useOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOutside]);
}

function GlobalSearch({ onGo }: { onGo: (href: string) => void }) {
  const [text, setText] = useState("");
  const q = useDebounced(text.trim(), 250);
  const [res, setRes] = useState<CrmSearchResult | null>(null);
  const [shown, setShown] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useOutside(box, () => setShown(false));

  useEffect(() => {
    if (q.length < 2) {
      setRes(null);
      return;
    }
    let live = true;
    crmService
      .search(q)
      .then((r) => live && (setRes(r), setShown(true)))
      .catch(() => live && setRes(null));
    return () => {
      live = false;
    };
  }, [q]);

  const items = res
    ? [
        ...res.customers.map((c) => ({ key: `c${c.id}`, href: `/admin/crm/customers/${c.id}`, title: c.name, sub: `Customer · ${c.code}`, name: c.name, icon: null as string | null })),
        ...res.suppliers.map((s) => ({ key: `s${s.id}`, href: `/admin/crm/suppliers/${s.id}`, title: s.name, sub: `Supplier · ${s.code}`, name: s.name, icon: null as string | null })),
        ...res.tickets.map((t) => ({ key: `t${t.reference}`, href: `/admin/crm/tickets?ref=${t.reference}`, title: t.subject, sub: `Ticket · ${t.reference}`, name: "", icon: "inbox" as string | null })),
      ]
    : [];
  const go = (href: string) => {
    setShown(false);
    setText("");
    onGo(href);
  };

  return (
    <div className={k("gsrch")} ref={box}>
      <label className={k("srch")}>
        <CIcon name="search" />
        <span className={k("sr")}>Search customers, suppliers and tickets</span>
        <input
          id="crm-gq"
          value={text}
          placeholder="Search customers, suppliers, tickets"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onFocus={() => res && setShown(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText("");
              setShown(false);
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Enter" && items[0]) go(items[0].href);
          }}
        />
        <kbd>/</kbd>
      </label>
      {shown && q.length >= 2 ? (
        <div className={k("pop gres")} role="listbox">
          {items.length ? (
            items.map((i) => (
              <button type="button" key={i.key} className={k("pi")} role="option" aria-selected="false" onClick={() => go(i.href)}>
                {i.icon ? (
                  <span className={k("pic")}>
                    <CIcon name={i.icon} />
                  </span>
                ) : (
                  <CAv name={i.name} size="xs" />
                )}
                <span className={k("row-m")}>
                  <b>{i.title}</b>
                  <small>{i.sub}</small>
                </span>
              </button>
            ))
          ) : (
            <p className={k("empty-s")}>{`No matches for “${text}”`}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Bell({ version, onGo }: { version: number; onGo: (href: string) => void }) {
  const [items, setItems] = useState<CrmNotification[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [shown, setShown] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useOutside(box, () => setShown(false));

  useEffect(() => {
    setSeen(seenIds());
    let live = true;
    crmService
      .notifications()
      .then((r) => live && setItems(r.content))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [version]);

  const unread = items.filter((i) => !seen.includes(i.id)).length;
  const markAll = () => {
    const all = items.map((i) => i.id);
    try {
      sessionStorage.setItem("crm-seen", JSON.stringify(all));
    } catch {
      /* private mode: the dot simply comes back */
    }
    setSeen(all);
  };

  return (
    <div className={k("pw")} ref={box}>
      <button type="button" className={k("btn ghost icon bell")} aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} aria-expanded={shown} onClick={() => setShown((s) => !s)}>
        <CIcon name="bell" />
        {unread ? <span className={k("dotn")} /> : null}
      </button>
      {shown ? (
        <div className={k("pop")}>
          <div className={k("pop-h")}>
            <b>Notifications</b>
            {items.length ? (
              <button type="button" className={k("btn ghost sm")} onClick={markAll}>
                Mark all as read
              </button>
            ) : null}
          </div>
          <div className={k("pop-l")}>
            {items.length ? (
              items.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={k(`pi ${seen.includes(n.id) ? "" : "unread"}`)}
                  onClick={() => {
                    setShown(false);
                    onGo(hrefFor(n.link));
                  }}
                >
                  <span className={k(`pic ${n.tone}`)}>
                    <CIcon name={n.icon} />
                  </span>
                  <span className={k("row-m")}>
                    <b>{n.title}</b>
                    <small>{n.subtitle}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className={k("empty-s")}>{"You’re all caught up."}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
