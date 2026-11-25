"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast, useDebounced } from "@/components/admin/ui";
import type { CrmMember, CrmSearchResult, PipelineStage, TicketPriority } from "@/types/api/crm.types";
import { useCrm, type ContactRef, type DialogKind, type OpenOptions } from "./CrmContext";
import { CIcon, Dialog, Field, fieldErrors, k } from "./ui";

/** A person to pick: searches customers and suppliers as you type. */
function ContactPicker({ value, onChange, error }: { value: ContactRef | null; onChange: (c: ContactRef | null) => void; error?: string | null }) {
  const [text, setText] = useState("");
  const q = useDebounced(text.trim(), 250);
  const [found, setFound] = useState<CrmSearchResult | null>(null);
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (value) return;
    let live = true;
    crmService
      .search(q, 6)
      .then((r) => live && setFound(r))
      .catch(() => live && setFound(null));
    return () => {
      live = false;
    };
  }, [q, value]);

  if (value) {
    return (
      <span className={k("req")} style={{ cursor: "default" }}>
        <span className={k("row-m")}>
          <b>{value.name}</b>
          <small>{value.kind === "customer" ? "Customer" : "Supplier"}</small>
        </span>
        <button type="button" className={k("btn ghost sm")} onClick={() => onChange(null)}>
          Change
        </button>
      </span>
    );
  }
  const rows: ContactRef[] = [
    ...(found?.suppliers ?? []).map((s) => ({ kind: "supplier" as const, id: s.id, name: s.name })),
    ...(found?.customers ?? []).map((c) => ({ kind: "customer" as const, id: c.id, name: c.name })),
  ];
  return (
    <div className={k("pw")}>
      <input
        className={k("inp")}
        value={text}
        placeholder="Search a customer or supplier"
        aria-invalid={error ? true : undefined}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        autoComplete="off"
      />
      {focus ? (
        <div className={k("pop")} style={{ left: 0, right: "auto", width: "100%" }} role="listbox">
          {rows.length ? (
            rows.map((r) => (
              <button type="button" key={`${r.kind}-${r.id}`} className={k("pi")} role="option" aria-selected="false" onMouseDown={() => onChange(r)}>
                <span className={k("row-m")}>
                  <b>{r.name}</b>
                  <small>{r.kind === "customer" ? "Customer" : "Supplier"}</small>
                </span>
              </button>
            ))
          ) : (
            <p className={k("empty-s")}>{q ? "No matches" : "Type a name or email"}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

const ownerOptions = (members: CrmMember[], withNone: boolean) => (
  <>
    {withNone ? <option value="">Unassigned</option> : null}
    {members.map((m) => (
      <option key={m.id} value={m.id}>
        {m.name}
      </option>
    ))}
  </>
);

const addDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
/** A date input's value as noon in the browser's day. */
const noon = (d: string) => new Date(`${d}T12:00:00`).toISOString();

interface DialogProps {
  open: boolean;
  onClose: () => void;
  options: OpenOptions;
  onSaved: (created: unknown) => void;
}

function TicketDialog({ open, onClose, options, onSaved }: DialogProps) {
  const { meta, members, me } = useCrm();
  const router = useRouter();
  const [about, setAbout] = useState<ContactRef | null>(options.about ?? null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [body, setBody] = useState("");
  const [owner, setOwner] = useState(me);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const er: Record<string, string> = {};
    if (!about) er.customerId = "Choose who this is for";
    if (subject.trim().length < 4) er.subject = "Add a short subject";
    if (body.trim().length < 4) er.body = "Add the details";
    setErrors(er);
    if (Object.keys(er).length || !about) return;
    setBusy(true);
    try {
      const t = await crmService.createTicket({
        ...(about.kind === "customer" ? { customerId: about.id } : { supplierId: about.id }),
        subject: subject.trim(),
        category,
        priority,
        body: body.trim(),
        ownerId: owner || null,
      });
      toast(`Ticket ${t.reference} created`);
      onSaved(t);
      router.push(`/admin/crm/tickets?ref=${t.reference}`);
    } catch (e) {
      const fe = fieldErrors(e);
      if (Object.keys(fe).length) setErrors({ ...fe, ...(fe.supplierId ? { customerId: fe.supplierId } : {}) });
      else toast(getApiErrorMessage(e, "Couldn't create the ticket."), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="New ticket" onClose={onClose} onSubmit={submit}>
      <Field label="Who is it for?" error={errors.customerId}>
        <ContactPicker value={about} onChange={setAbout} error={errors.customerId} />
      </Field>
      <Field label="Subject" htmlFor="tk-s" error={errors.subject}>
        <input id="tk-s" className={k("inp")} value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={errors.subject ? true : undefined} />
      </Field>
      <div className={k("fg2")}>
        <Field label="Type" htmlFor="tk-c">
          <select id="tk-c" className={k("inp")} value={category} onChange={(e) => setCategory(e.target.value)}>
            {meta.ticketCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority" htmlFor="tk-p">
          <select id="tk-p" className={k("inp")} value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
            {meta.ticketPriorities.map((p) => (
              <option key={p} value={p}>
                {p[0]!.toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Details" htmlFor="tk-m" error={errors.body}>
        <textarea id="tk-m" className={k("inp")} rows={3} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={errors.body ? true : undefined} />
      </Field>
      <Field label="Assign to" htmlFor="tk-o" error={errors.ownerId}>
        <select id="tk-o" className={k("inp")} value={owner} onChange={(e) => setOwner(e.target.value)}>
          {ownerOptions(members, true)}
        </select>
      </Field>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")} disabled={busy}>
          Create ticket
        </button>
      </div>
    </Dialog>
  );
}

function TaskDialog({ open, onClose, options, onSaved }: DialogProps) {
  const { members, me } = useCrm();
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState<ContactRef | null>(options.about ?? null);
  const [due, setDue] = useState(addDays(1));
  const [owner, setOwner] = useState(me);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const er: Record<string, string> = {};
    if (title.trim().length < 3) er.title = "Describe the task";
    if (!due) er.due = "Pick a due date";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const t = await crmService.createTask({
        title: title.trim(),
        ...(about ? (about.kind === "customer" ? { customerId: about.id } : { supplierId: about.id }) : {}),
        due: noon(due),
        ownerId: owner || null,
      });
      toast("Task added");
      onSaved(t);
    } catch (e) {
      const fe = fieldErrors(e);
      if (Object.keys(fe).length) setErrors(fe);
      else toast(getApiErrorMessage(e, "Couldn't add the task."), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="New task" onClose={onClose} onSubmit={submit}>
      <Field label="What needs doing?" htmlFor="ts-t" error={errors.title}>
        <input id="ts-t" className={k("inp")} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={errors.title ? true : undefined} />
      </Field>
      <Field label={<>Related to <span className={k("muted")}>(optional)</span></>}>
        <ContactPicker value={about} onChange={setAbout} />
      </Field>
      <div className={k("fg2")}>
        <Field label="Due" htmlFor="ts-d" error={errors.due}>
          <input id="ts-d" className={k("inp")} type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-invalid={errors.due ? true : undefined} />
        </Field>
        <Field label="Owner" htmlFor="ts-o">
          <select id="ts-o" className={k("inp")} value={owner} onChange={(e) => setOwner(e.target.value)}>
            {ownerOptions(members, false)}
          </select>
        </Field>
      </div>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")} disabled={busy}>
          Add task
        </button>
      </div>
    </Dialog>
  );
}

function LeadDialog({ open, onClose, onSaved }: DialogProps) {
  const { meta, members, me } = useCrm();
  const [v, setV] = useState({ company: "", contact: "", email: "", category: "", source: "Outreach", products: "", owner: me });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [key]: e.target.value }));

  const submit = async () => {
    const er: Record<string, string> = {};
    if (v.company.trim().length < 2) er.company = "Enter the company name";
    if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) er.email = "Check the email";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const s = await crmService.createSupplier({
        company: v.company.trim(),
        contactName: v.contact.trim() || undefined,
        email: v.email.trim() || undefined,
        category: v.category.trim() || undefined,
        source: v.source,
        estProducts: Number(v.products) || 0,
        ownerId: v.owner || null,
      });
      toast(`${s.company} added to Lead`);
      onSaved(s);
    } catch (e) {
      const fe = fieldErrors(e);
      if (Object.keys(fe).length) setErrors(fe);
      else toast(getApiErrorMessage(e, "Couldn't add the lead."), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="New supplier lead" onClose={onClose} onSubmit={submit}>
      <Field label="Company" htmlFor="ld-n" error={errors.company}>
        <input id="ld-n" className={k("inp")} value={v.company} onChange={set("company")} aria-invalid={errors.company ? true : undefined} />
      </Field>
      <div className={k("fg2")}>
        <Field label="Contact person" htmlFor="ld-c">
          <input id="ld-c" className={k("inp")} value={v.contact} onChange={set("contact")} />
        </Field>
        <Field label="Email" htmlFor="ld-e" error={errors.email}>
          <input id="ld-e" className={k("inp")} type="email" value={v.email} onChange={set("email")} aria-invalid={errors.email ? true : undefined} />
        </Field>
      </div>
      <div className={k("fg2")}>
        <Field label="Category" htmlFor="ld-k">
          <input id="ld-k" className={k("inp")} value={v.category} onChange={set("category")} placeholder="e.g. Home decor" />
        </Field>
        <Field label="Source" htmlFor="ld-s">
          <select id="ld-s" className={k("inp")} value={v.source} onChange={set("source")}>
            {meta.supplierSources
              .filter((s) => s !== "Seller Portal")
              .map((s) => (
                <option key={s}>{s}</option>
              ))}
          </select>
        </Field>
      </div>
      <div className={k("fg2")}>
        <Field label="Est. products" htmlFor="ld-p">
          <input id="ld-p" className={k("inp")} inputMode="numeric" value={v.products} onChange={set("products")} />
        </Field>
        <Field label="Owner" htmlFor="ld-o">
          <select id="ld-o" className={k("inp")} value={v.owner} onChange={set("owner")}>
            {ownerOptions(members, false)}
          </select>
        </Field>
      </div>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")} disabled={busy}>
          Add lead
        </button>
      </div>
    </Dialog>
  );
}

function CustomerDialog({ open, onClose, onSaved }: DialogProps) {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [key]: e.target.value }));

  const submit = async () => {
    const er: Record<string, string> = {};
    if (v.name.trim().length < 2) er.name = "Enter their name";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) er.email = "Enter a valid email";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const c = await crmService.createCustomer({ name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() || undefined });
      toast("Customer added");
      onSaved(c);
      router.push(`/admin/crm/customers/${c.id}`);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      const fe = fieldErrors(e);
      if (status === 409) setErrors({ email: "A customer with this email already exists" });
      else if (Object.keys(fe).length) setErrors(fe);
      else toast(getApiErrorMessage(e, "Couldn't add the customer."), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title="New customer" onClose={onClose} onSubmit={submit}>
      <p className={k("help")}>Customers are created when they sign up or place an order. Add one by hand only for phone or email enquiries.</p>
      <Field label="Full name" htmlFor="cu-n" error={errors.name}>
        <input id="cu-n" className={k("inp")} value={v.name} onChange={set("name")} aria-invalid={errors.name ? true : undefined} />
      </Field>
      <div className={k("fg2")}>
        <Field label="Email" htmlFor="cu-e" error={errors.email}>
          <input id="cu-e" className={k("inp")} type="email" value={v.email} onChange={set("email")} aria-invalid={errors.email ? true : undefined} />
        </Field>
        <Field label={<>Phone <span className={k("muted")}>(optional)</span></>} htmlFor="cu-p">
          <input id="cu-p" className={k("inp")} type="tel" value={v.phone} onChange={set("phone")} />
        </Field>
      </div>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")} disabled={busy}>
          Add customer
        </button>
      </div>
    </Dialog>
  );
}

const CREATE_ITEMS: Array<[Exclude<DialogKind, "create">, string, string, string]> = [
  ["ticket", "inbox", "Ticket", "A customer or supplier issue"],
  ["task", "check", "Task", "A follow-up with a due date"],
  ["lead", "truck", "Supplier lead", "Add to the supplier pipeline"],
  ["customer", "users", "Customer", "Usually created by an order"],
];

/** The "Create" menu and the four dialogs behind it, opened from anywhere in the CRM. */
export interface DialogRequest {
  kind: DialogKind;
  options: OpenOptions;
  /** A new one each time a dialog opens, so its form starts empty. */
  nonce: number;
}

export function CrmDialogs({ request, onClose, onSaved }: { request: DialogRequest | null; onClose: () => void; onSaved: (created: unknown, options: OpenOptions) => void }) {
  const { open } = useCrm();
  const kind = request?.kind;
  const options = request?.options ?? {};
  const nonce = request?.nonce ?? 0;

  const props = { onClose, options, onSaved: (c: unknown) => onSaved(c, options) };
  return (
    <>
      <Dialog open={kind === "create"} title="Create" onClose={onClose}>
        <div className={k("newl")}>
          {CREATE_ITEMS.map(([id, icon, title, sub]) => (
            <button type="button" key={id} onClick={() => open(id)}>
              <span className={k("ic")}>
                <CIcon name={icon} />
              </span>
              <span>
                <b>{title}</b>
                <small>{sub}</small>
              </span>
            </button>
          ))}
        </div>
      </Dialog>
      {kind === "ticket" ? <TicketDialog key={`t${nonce}`} open {...props} /> : null}
      {kind === "task" ? <TaskDialog key={`k${nonce}`} open {...props} /> : null}
      {kind === "lead" ? <LeadDialog key={`l${nonce}`} open {...props} /> : null}
      {kind === "customer" ? <CustomerDialog key={`c${nonce}`} open {...props} /> : null}
    </>
  );
}

/** Choose a stage to move a supplier to (the "⋯" menu on a card), or why a supplier is lost. */
export function MoveDialog({ open, company, current, onClose, onMove }: { open: boolean; company: string; current: PipelineStage; onClose: () => void; onMove: (stage: PipelineStage) => void }) {
  const { meta } = useCrm();
  const [to, setTo] = useState<PipelineStage>(current);
  return (
    <Dialog open={open} title={`Move ${company}`} onClose={onClose} onSubmit={() => onMove(to)}>
      <fieldset className={k("fs")}>
        <legend className={k("sr")}>Stage</legend>
        <div className={k("stlist")}>
          {meta.stages.map((s) => (
            <label key={s.key} className={k("sto")}>
              <input type="radio" name="ms" value={s.key} checked={to === s.key} onChange={() => setTo(s.key)} />
              <span className={k(`cdot st-${s.key}`)} />
              <span>
                <b>{s.label}</b>
                <small>{s.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")}>
          Move
        </button>
      </div>
    </Dialog>
  );
}

export function LostDialog({ open, company, onClose, onConfirm }: { open: boolean; company: string; onClose: () => void; onConfirm: (reason: string, note: string) => void }) {
  const { meta } = useCrm();
  const [reason, setReason] = useState(meta.lostReasons[0] ?? "");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} title={`Why is ${company} lost?`} onClose={onClose} onSubmit={() => onConfirm(reason, note.trim())}>
      <fieldset className={k("fs")}>
        <legend className={k("lab")}>Reason</legend>
        <div className={k("chips")}>
          {meta.lostReasons.map((r) => (
            <label key={r} className={k("chip")}>
              <input type="radio" name="lr" value={r} checked={reason === r} onChange={() => setReason(r)} />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={<>Note <span className={k("muted")}>(optional)</span></>} htmlFor="lr-n">
        <input id="lr-n" className={k("inp")} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn bad")}>
          Mark as lost
        </button>
      </div>
    </Dialog>
  );
}

/** A stage the Seller Portal normally sets by itself: ask before moving by hand. */
export function ConfirmPortalDialog({ open, stage, onClose, onConfirm }: { open: boolean; stage: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} title={`Move to ${stage}?`} onClose={onClose} onSubmit={onConfirm}>
      <p className={k("muted")}>These stages normally update on their own from the Seller Portal and Supplier approvals. Move by hand only if they applied another way.</p>
      <div className={k("df")}>
        <button type="button" className={k("btn ghost")} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={k("btn pri")}>
          Move anyway
        </button>
      </div>
    </Dialog>
  );
}
