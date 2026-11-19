"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ORDER_STATE } from "@/components/seller/orders";
import { ATTACH_ACCEPT, HelpBar, MAX_FILES, TOPICS, pickFiles } from "@/components/seller/support";
import { FieldError, Ico, errorText } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { SellerOrderRow, SellerPayoutRow, SellerProduct, TicketTopic } from "@/types/api/seller.types";

type Errors = Partial<Record<"topic" | "subject" | "body", string>>;

/** Raise a ticket (designs/seller/seller-support.html, #new). ?topic=orders&ref=EC-1 preselects. */
export default function RaiseTicketPage() {
  useTitle("Raise a ticket");
  const router = useRouter();
  const [topic, setTopic] = useState<TicketTopic | "">("");
  const [rel, setRel] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<SellerOrderRow[] | null>(null);
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [payouts, setPayouts] = useState<SellerPayoutRow[] | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("topic");
    if (t && TOPICS.some((x) => x.key === t)) setTopic(t as TicketTopic);
    setRel(p.get("ref") ?? "");
  }, []);

  // The "which one?" list for the chosen topic, loaded once.
  useEffect(() => {
    if (topic === "orders" && !orders) sellerService.orderList({ tab: "all", size: 50 }).then((r) => setOrders(r.data.data?.content ?? [])).catch(() => setOrders([]));
    if (topic === "products" && !products) sellerService.catalog().then((r) => setProducts(r.data.data ?? [])).catch(() => setProducts([]));
    if (topic === "payments" && !payouts) sellerService.payouts().then((r) => setPayouts(r.data.data?.history ?? [])).catch(() => setPayouts([]));
  }, [topic, orders, products, payouts]);

  const relatedType = topic === "orders" ? "order" : topic === "products" ? "product" : topic === "payments" ? "payout" : undefined;
  const route = useMemo(() => TOPICS.find((t) => t.key === topic), [topic]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!topic) e.topic = "Choose what it's about";
    if (subject.trim().length < 4) e.subject = "Add a short subject";
    if (body.trim().length < 10) e.body = "Tell us a bit more: what you tried and what happened";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setServerErr(null);
    if (Object.keys(e).length) {
      document.getElementById(e.topic ? "sp-topics" : e.subject ? "sp-sj" : "sp-ds")?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await sellerService.raiseTicket(
        { topic: topic as TicketTopic, subject: subject.trim(), body: body.trim(), urgent, relatedType: rel ? relatedType : undefined, relatedRef: rel || undefined },
        files
      );
      router.push(`/merchant/support/${res.data.data!.reference}?raised=1`);
    } catch (err) {
      setServerErr(errorText(err, "We couldn't send your ticket. Try again."));
      setBusy(false);
    }
  };

  return (
    <>
      <p className="sp-crumb">
        <Link href="/merchant/support">Help &amp; support</Link> / Raise a ticket
      </p>
      <div className="sp-ph">
        <div>
          <h1>Raise a ticket</h1>
          <p>Tell us what&apos;s wrong. It goes straight to the right team, and you can follow every reply here.</p>
        </div>
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="sp-od">
          <div className="sp-stack2">
            <section className="sp-card">
              <fieldset>
                <legend className="sp-lab" style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>
                  What is it about? <span className="sp-req">*</span>
                </legend>
                <div className="sp-topics" id="sp-topics" tabIndex={-1}>
                  {TOPICS.map((t) => (
                    <label key={t.key} className="sp-topic">
                      <input
                        type="radio"
                        name="topic"
                        value={t.key}
                        checked={topic === t.key}
                        onChange={() => {
                          setTopic(t.key);
                          setErrors((x) => ({ ...x, topic: undefined }));
                          if (topic && topic !== t.key) setRel("");
                        }}
                      />
                      <span>
                        <span className="sp-ti">
                          <Ico name={t.icon} />
                        </span>
                        <span>
                          <b>{t.title}</b>
                          <small>{t.hint}</small>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError id="sp-tp-e">{errors.topic}</FieldError>
              </fieldset>
            </section>

            <section className="sp-card" style={{ display: "grid", gap: 14 }}>
              {topic === "orders" ? (
                <label className="sp-field" htmlFor="sp-rel">
                  <span className="sp-lab">
                    <span>Which order?</span>
                    <span className="sp-opt">Optional</span>
                  </span>
                  <select className="sp-inp" id="sp-rel" value={rel} onChange={(e) => setRel(e.target.value)}>
                    <option value="">Not about one order</option>
                    {rel && !orders?.some((o) => o.orderNumber === rel) ? <option value={rel}>{rel}</option> : null}
                    {(orders ?? []).map((o) => (
                      <option key={o.orderNumber} value={o.orderNumber}>
                        {o.orderNumber} · {o.items[0]?.productName.split(",")[0] ?? "Item"} · {ORDER_STATE[o.state].label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : topic === "products" ? (
                <label className="sp-field" htmlFor="sp-rel">
                  <span className="sp-lab">
                    <span>Which product?</span>
                    <span className="sp-opt">Optional</span>
                  </span>
                  <select className="sp-inp" id="sp-rel" value={rel} onChange={(e) => setRel(e.target.value)}>
                    <option value="">Not about one product</option>
                    {(products ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.code}
                      </option>
                    ))}
                  </select>
                </label>
              ) : topic === "payments" && payouts?.length ? (
                <label className="sp-field" htmlFor="sp-rel">
                  <span className="sp-lab">
                    <span>Which payout?</span>
                    <span className="sp-opt">Optional</span>
                  </span>
                  <select className="sp-inp" id="sp-rel" value={rel} onChange={(e) => setRel(e.target.value)}>
                    <option value="">Not about one payout</option>
                    {payouts.map((p) => (
                      <option key={p.reference} value={p.reference}>
                        {p.reference} · {p.status === "PAID" ? "paid" : "scheduled"}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="sp-field" htmlFor="sp-sj">
                <span className="sp-lab">
                  <span>
                    Subject <span className="sp-req">*</span>
                  </span>
                </span>
                <input
                  className="sp-inp"
                  id="sp-sj"
                  maxLength={120}
                  value={subject}
                  aria-invalid={errors.subject ? true : undefined}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setErrors((x) => ({ ...x, subject: undefined }));
                  }}
                  placeholder="e.g. Can't update the photos on my table lamp"
                />
                <FieldError id="sp-sj-e">{errors.subject}</FieldError>
              </label>
              <label className="sp-field" htmlFor="sp-ds">
                <span className="sp-lab">
                  <span>
                    What happened? <span className="sp-req">*</span>
                  </span>
                </span>
                <textarea
                  className="sp-inp"
                  id="sp-ds"
                  rows={6}
                  maxLength={5000}
                  value={body}
                  aria-invalid={errors.body ? true : undefined}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setErrors((x) => ({ ...x, body: undefined }));
                  }}
                  placeholder="What were you trying to do, what happened instead, and any error message you saw."
                />
                <span className="sp-help">The more detail you add, the faster we can fix it.</span>
                <FieldError id="sp-ds-e">{errors.body}</FieldError>
              </label>
              <div className="sp-field">
                <span className="sp-lab">
                  Attachments <span className="sp-opt">Optional</span>
                </span>
                <label className="sp-drop" htmlFor="sp-nf">
                  <Ico name="upload" />
                  <span>
                    <b>Add screenshots or files</b> · PDF, JPG, PNG, CSV · up to {MAX_FILES}
                  </span>
                  <input
                    type="file"
                    id="sp-nf"
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
                </label>
                {files.length ? <span className="sp-help">{files.map((f) => f.name).join(", ")}</span> : null}
                <FieldError id="sp-nf-e">{fileNote}</FieldError>
              </div>
              <fieldset className="sp-field">
                <legend className="sp-lab" style={{ marginBottom: 6 }}>
                  Is this stopping you from selling or shipping?
                </legend>
                <div className="sp-yn">
                  <label>
                    <input type="radio" name="urg" checked={!urgent} onChange={() => setUrgent(false)} />
                    <span>No</span>
                  </label>
                  <label>
                    <input type="radio" name="urg" checked={urgent} onChange={() => setUrgent(true)} />
                    <span>Yes, it&apos;s urgent</span>
                  </label>
                </div>
              </fieldset>
            </section>
          </div>
          <aside className="sp-side2">
            <section className="sp-card">
              <div className="sp-ch">
                <h2>Where it goes</h2>
              </div>
              <p style={{ fontSize: 14 }}>
                {route ? (
                  <>
                    Your ticket goes to our <b>{route.team}</b>
                    {urgent ? ", marked urgent so it's answered first" : ""}.
                  </>
                ) : (
                  "Choose a topic and we'll send it to the right team."
                )}
              </p>
              <p className="sp-note-s">Every ticket is logged with your company name, so you never have to repeat yourself.</p>
              {serverErr ? (
                <div className="sp-alert sp-alert-bad" role="alert" style={{ marginTop: 12 }}>
                  <Ico name="alert" />
                  <span>{serverErr}</span>
                </div>
              ) : null}
              <button type="submit" className="sp-btn sp-btn-pri" style={{ width: "100%", marginTop: 14 }} disabled={busy}>
                <Ico name="mail" />
                {busy ? "Sending…" : "Send ticket"}
              </button>
              <Link className="sp-btn sp-btn-ghost" style={{ width: "100%", marginTop: 6 }} href="/merchant/support">
                Cancel
              </Link>
            </section>
            <HelpBar />
          </aside>
        </div>
      </form>
    </>
  );
}
