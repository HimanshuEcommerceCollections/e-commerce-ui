"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import crmService from "@/services/admin/crm.service";
import { Pager, useDebounced, usePageTitle } from "@/components/admin/ui";
import { useCrm } from "@/components/admin/crm/CrmContext";
import { useLoad } from "@/components/admin/crm/useLoad";
import { Av, CAv, CIcon, Tag, k, money, rel } from "@/components/admin/crm/ui";
import type { CustomerQuery } from "@/types/api/crm.types";

const SIZE = 25;
type Sort = NonNullable<CustomerQuery["sort"]>;

export default function CrmCustomersPage() {
  return (
    <Suspense fallback={<p className={k("loading")}>Loading…</p>}>
      <Customers />
    </Suspense>
  );
}

/** Everyone who has ordered or contacted us, with their orders, tickets and history. */
function Customers() {
  usePageTitle("CRM · Customers");
  const router = useRouter();
  const { meta, members, version, open } = useCrm();
  // Admin › Customers links here with ?q=<email>.
  const [text, setText] = useState(useSearchParams().get("q") ?? "");
  const q = useDebounced(text.trim(), 250);
  const [tag, setTag] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState<Sort>("last");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [q, tag, owner, sort, dir]);

  const list = useLoad(() => crmService.customers({ q: q || undefined, tag: tag || undefined, owner: owner || undefined, sort, dir, page, size: SIZE }), [q, tag, owner, sort, dir, page, version]);
  const d = list.data;
  const filtered = !!(q || tag || owner);
  const clear = () => {
    setText("");
    setTag("");
    setOwner("");
  };
  const sortBy = (key: Sort) => {
    if (sort === key) setDir((x) => (x === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
  };
  const th = (key: Sort, label: string, cls = "") => (
    <th className={cls} aria-sort={sort === key ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => sortBy(key)}>
        {label}
        {sort === key ? <CIcon name={dir === "asc" ? "up" : "chev"} /> : null}
      </button>
    </th>
  );

  return (
    <>
      <div className={k("ph")}>
        <div>
          <h1>Customers</h1>
          <p>Everyone who has ordered or contacted us, with their orders, tickets and history.</p>
        </div>
        <button type="button" className={k("btn pri")} onClick={() => open("customer")}>
          <CIcon name="plus" />
          Add customer
        </button>
      </div>
      <div className={k("card")}>
        <div className={k("tools")}>
          <label className={k("srch")}>
            <CIcon name="search" />
            <span className={k("sr")}>Search customers</span>
            <input placeholder="Name, email, ID or city" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className={k("sr")} htmlFor="ft">
            Tag
          </label>
          <select className={k("inp fsel")} id="ft" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {meta.customerTags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
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
          {filtered ? (
            <button type="button" className={k("btn ghost sm")} onClick={clear}>
              Clear filters
            </button>
          ) : null}
          <span className={k("cnt grow")}>{d ? (d.totalElements === d.allCount ? `${d.totalElements} customers` : `${d.totalElements} of ${d.allCount}`) : ""}</span>
        </div>
        <div className={k("tw")}>
          <table className={k("tbl resp")}>
            <thead>
              <tr>
                {th("name", "Customer")}
                <th className={k("c-loc c-d")}>Location</th>
                {th("orders", "Orders", "r c-d")}
                {th("ltv", "Lifetime spend", "r c-d")}
                {th("last", "Last order", "c-d")}
                <th className={k("c-d")}>Tags</th>
                <th className={k("c-own")}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {list.error && !d ? (
                <tr>
                  <td colSpan={7} className={k("empty")}>
                    {list.error}
                  </td>
                </tr>
              ) : null}
              {d?.content.map((x) => (
                <tr key={x.id} data-go={x.id} onClick={(e) => !(e.target as HTMLElement).closest("a") && router.push(`/admin/crm/customers/${x.id}`)}>
                  <td className={k("c-main")}>
                    <Link href={`/admin/crm/customers/${x.id}`} className={k("nm")}>
                      <CAv name={x.name} size="sm" />
                      <span>
                        <b>{x.name}</b>
                        <small>{x.email ?? x.phone ?? "No email"}</small>
                      </span>
                    </Link>
                  </td>
                  <td className={k("c-loc c-d muted")}>{x.location ?? "—"}</td>
                  <td className={k("r num c-d")}>{x.orders}</td>
                  <td className={k("r num c-d")}>{money(x.ltv)}</td>
                  <td className={k("c-d")}>{x.lastOrderAt ? rel(x.lastOrderAt) : <span className={k("muted")}>No orders</span>}</td>
                  <td className={k("c-d")}>
                    <span className={k("tags")}>{x.tags.length ? x.tags.map((t) => <Tag key={t} tag={t} />) : <span className={k("faint")}>—</span>}</span>
                  </td>
                  <td className={k("c-own")}>
                    <Av member={x.owner} size="xs" />
                  </td>
                  <td className={k("c-mob")}>
                    <span>
                      {x.orders} order{x.orders === 1 ? "" : "s"} · {money(x.ltv)} · {x.lastOrderAt ? `last ${rel(x.lastOrderAt)}` : "no orders"}
                    </span>
                    {x.tags.map((t) => (
                      <Tag key={t} tag={t} />
                    ))}
                  </td>
                </tr>
              ))}
              {d && !d.content.length ? (
                <tr>
                  <td colSpan={7} className={k("empty")}>
                    No customers match.{" "}
                    <button type="button" className={k("btn ghost sm")} onClick={clear}>
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : null}
              {!d && !list.error ? (
                <tr>
                  <td colSpan={7} className={k("empty")}>
                    Loading…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {d && d.totalPages > 1 ? (
          <div className={k("pager")}>
            <span>
              Page {d.number + 1} of {d.totalPages}
            </span>
            <Pager page={page} pages={d.totalPages} onPage={setPage} />
          </div>
        ) : null}
      </div>
    </>
  );
}
