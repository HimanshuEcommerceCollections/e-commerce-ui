"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import publicCategoryService from "@/services/public/category.service";
import sellerService from "@/services/seller/seller.service";
import type { CategoryTreeNode } from "@/types/api/category.types";
import type { SubmissionReport, TemplateRow } from "@/types/api/seller.types";
import { FieldError, Ico, Loading, errorText, reviewBy } from "./ui";

// ─── Rules shared with the bulk check (designs: seller-portal-phase1) ────────

const COUNTRIES = ["United States", "China", "India", "Vietnam", "Mexico", "Bangladesh", "Turkey", "Portugal", "Italy", "Other"];
const PROMO = /\b(free shipping|sale|best price|discount|cheap|buy now|limited offer|\d+%\s*off)\b/i;
const SKU_RE = /^[A-Za-z0-9._-]+$/;
const ORIGIN_LINE = /^Country of origin:\s*(.*)$/im;
const MAX_IMAGES = 5;
const MIN_PX = 1000;

export function checkTitle(raw: string) {
  const t = raw.trim();
  if (!t) return "Add a product title";
  if (t.length < 10) return `Too short: ${t.length} of at least 10 characters`;
  if (t.length > 150) return `Too long: ${t.length} of 150 characters max`;
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length > 6 && letters === letters.toUpperCase()) return "Don't write the title in ALL CAPS";
  if (PROMO.test(t)) return "Remove sales words like “sale”, “free shipping” or “% off”";
  return "";
}

const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(/[$,\s]/g, "")));

interface Img {
  url: string;
  state: "checking" | "ok" | "small" | "bad";
  dims?: string;
}

interface Values {
  title: string;
  brand: string;
  sku: string;
  cat: string; // "department|subcategory" slugs
  desc: string;
  price: string;
  mrp: string;
  stock: string;
  weight: string;
  l: string;
  w: string;
  h: string;
  origin: string;
  fiber: string;
}

const BLANK: Values = { title: "", brand: "", sku: "", cat: "", desc: "", price: "", mrp: "", stock: "", weight: "", l: "", w: "", h: "", origin: "", fiber: "" };
type Key = keyof Values | "img" | "dim";

const LABELS: Record<string, string> = {
  title: "Product title",
  brand: "Brand",
  sku: "SKU",
  cat: "Category",
  img: "Photos",
  price: "Your price",
  mrp: "MRP",
  stock: "Stock",
  weight: "Weight",
  dim: "Packed size",
  origin: "Country of origin",
  fiber: "Fiber content",
};

/** Clothing needs fiber content (US labelling). */
const isApparel = (dept: CategoryTreeNode | undefined) => !!dept && /cloth|apparel|fashion/i.test(`${dept.slug} ${dept.name}`);

function validate(v: Values, imgs: Img[], dept: CategoryTreeNode | undefined, editing: boolean) {
  const e: Partial<Record<Key, string>> = {};
  const t = checkTitle(v.title);
  if (t) e.title = t;
  if (!v.brand.trim()) e.brand = "Add the brand name";
  if (!editing) {
    if (!v.sku.trim()) e.sku = "Add your SKU";
    else if (!SKU_RE.test(v.sku.trim())) e.sku = "Use only letters, digits, '.', '_' and '-'";
  }
  if (!v.cat) e.cat = "Choose a category";
  if (!imgs.length) e.img = "Add at least one photo";
  else if (imgs.some((i) => i.state === "small")) e.img = `Remove or replace photos smaller than ${MIN_PX} px`;
  else if (imgs.some((i) => i.state === "bad")) e.img = "One image link couldn't be opened. Remove it or check the link.";
  const pr = num(v.price);
  const mr = num(v.mrp);
  if (isNaN(pr) || pr <= 0) e.price = "Enter your price, like 28.50";
  if (isNaN(mr) || mr <= 0) e.mrp = "Enter the MRP";
  else if (!isNaN(pr) && pr > mr) e.price = `Your price can't be higher than the MRP ($${mr.toFixed(2)})`;
  if (!/^\d+$/.test(v.stock.trim())) e.stock = "Enter a whole number, 0 or more";
  if (!(num(v.weight) > 0)) e.weight = "Enter the packed weight";
  if ([v.l, v.w, v.h].some((x) => !(num(x) > 0))) e.dim = "Enter length, width and height";
  if (!v.origin) e.origin = "Choose the country of origin";
  if (isApparel(dept) && !v.fiber.trim()) e.fiber = "Fiber content is required for clothing";
  return e;
}

/** Template row → form values (edit mode). */
function fromRow(r: TemplateRow): { values: Values; imgs: string[] } {
  const dims = (r.Dimensions ?? "").match(/[\d.]+/g) ?? [];
  const origin = ORIGIN_LINE.exec(r.Specifications ?? "")?.[1]?.trim() ?? "";
  return {
    values: {
      title: r.Product_Name ?? "",
      brand: r.Brand ?? "",
      sku: r.SKU_ID ?? "",
      cat: r.Category ? `${r.Category}|${r.Subcategory ?? ""}` : "",
      desc: r.Long_Description ?? "",
      price: r.Selling_Price ?? "",
      mrp: r.MRP ?? "",
      stock: r.Inventory_Qty ?? "",
      weight: (r.Weight ?? "").match(/[\d.]+/)?.[0] ?? "",
      l: dims[0] ?? "",
      w: dims[1] ?? "",
      h: dims[2] ?? "",
      origin: COUNTRIES.includes(origin) ? origin : origin ? "Other" : "",
      fiber: r.Material ?? "",
    },
    imgs: [1, 2, 3, 4, 5].map((i) => r[`Image_${i}_URL`] ?? "").filter(Boolean),
  };
}

/** Form values → one template row; an edit keeps every other column of the live row. */
function toRow(v: Values, imgs: Img[], base: TemplateRow | null, status: string): Record<string, string> {
  const [dept, sub] = v.cat.split("|");
  const specs = (base?.Specifications ?? "").replace(ORIGIN_LINE, "").trim();
  const row: Record<string, string> = {
    ...(base ?? {}),
    SKU_ID: base?.SKU_ID ?? v.sku.trim().toUpperCase(),
    Parent_Product_ID: base?.Parent_Product_ID ?? "",
    Product_Name: v.title.trim(),
    Brand: v.brand.trim(),
    Category: dept,
    Subcategory: sub ?? "",
    Product_Status: status,
    Long_Description: v.desc.trim(),
    Selling_Price: num(v.price).toFixed(2),
    MRP: num(v.mrp).toFixed(2),
    Discount: "",
    Inventory_Qty: String(Number(v.stock.trim())),
    Weight: `${num(v.weight)} lb`,
    Dimensions: `${num(v.l)} x ${num(v.w)} x ${num(v.h)} in`,
    Specifications: [`Country of origin: ${v.origin}`, specs].filter(Boolean).join("\n"),
    Material: v.fiber.trim() || base?.Material || "",
  };
  for (let i = 0; i < MAX_IMAGES; i++) row[`Image_${i + 1}_URL`] = imgs[i]?.url ?? "";
  return row;
}

type Done = { kind: "submitted"; reference: string; title: string; sku: string } | null;

/**
 * "Add one product" (and edit / fix and resubmit): one SKU as a template row,
 * sent through the seller submission API. Checks as you type; the server runs
 * the same checks as a bulk upload.
 */
export function ProductForm({ editId }: { editId: string | null }) {
  const [tree, setTree] = useState<CategoryTreeNode[] | null>(null);
  const [v, setV] = useState<Values>(BLANK);
  const [imgs, setImgs] = useState<Img[]>([]);
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [forced, setForced] = useState(false);
  const [base, setBase] = useState<TemplateRow | null>(null);
  const [rows, setRows] = useState<TemplateRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [serverErrs, setServerErrs] = useState<string[]>([]);
  const [saved, setSaved] = useState("Not saved yet");
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [done, setDone] = useState<Done>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicCategoryService
      .getTree()
      .then((r) => setTree(r.data.data ?? []))
      .catch(() => setTree([]));
  }, []);

  const loadRow = (r: TemplateRow) => {
    const f = fromRow(r);
    setBase(r);
    setV(f.values);
    setImgs(f.imgs.map((u) => ({ url: u, state: "checking" })));
    f.imgs.forEach(probe);
  };

  useEffect(() => {
    if (!editId) return;
    sellerService
      .productRows(editId)
      .then((res) => {
        const all = res.data.data ?? [];
        setRows(all);
        const wanted = new URLSearchParams(window.location.search).get("sku");
        const r = all.find((x) => x.SKU_ID === wanted) ?? all[0];
        if (r) loadRow(r);
        else setLoadErr("This product has no SKUs to edit.");
      })
      .catch((e) => setLoadErr(errorText(e, "We couldn't load this product.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per product
  }, [editId]);

  /** Loads the image in the browser to learn its size; the server checks the link again on submit. */
  function probe(u: string) {
    const im = new Image();
    im.onload = () => {
      const big = Math.max(im.naturalWidth, im.naturalHeight) >= MIN_PX;
      setImgs((list) => list.map((i) => (i.url === u ? { ...i, state: big ? "ok" : "small", dims: `${im.naturalWidth} × ${im.naturalHeight}` } : i)));
    };
    im.onerror = () => setImgs((list) => list.map((i) => (i.url === u ? { ...i, state: "bad" } : i)));
    im.src = u;
  }

  const options = useMemo(
    () =>
      (tree ?? []).flatMap((d) =>
        d.subcategories.length
          ? d.subcategories.map((s) => ({ value: `${d.slug}|${s.slug}`, label: `${d.name} › ${s.name}` }))
          : [{ value: `${d.slug}|`, label: d.name }]
      ),
    [tree]
  );
  const dept = tree?.find((d) => d.slug === v.cat.split("|")[0]);
  const apparel = isApparel(dept);
  const editing = !!editId;
  const status = (base?.Product_Status ?? "").toUpperCase();
  const isLive = status === "ACTIVE" || status === "INACTIVE";
  const errs = validate(v, imgs, dept, editing);
  const show = (k: Key) => ((forced || touched[k]) && errs[k] ? errs[k] : undefined);
  const set = (k: keyof Values) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setSaved("Unsaved changes");
  };
  const touch = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));

  const SECS: { name: string; keys: Key[]; anchor: string }[] = [
    { name: "Basic details", keys: ["title", "brand", "sku", "cat"], anchor: "sp-title" },
    { name: "Photos", keys: ["img"], anchor: "sp-iurl" },
    { name: "Price and stock", keys: ["price", "mrp", "stock"], anchor: "sp-price" },
    { name: "Weight and size", keys: ["weight", "dim"], anchor: "sp-weight" },
    { name: "Country of origin", keys: ["origin"], anchor: "sp-origin" },
    ...(apparel ? [{ name: "Fiber content", keys: ["fiber"] as Key[], anchor: "sp-fiber" }] : []),
  ];
  const secOk = (keys: Key[]) => keys.every((k) => !errs[k]);
  const doneCount = SECS.filter((s) => secOk(s.keys)).length;
  const jump = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus({ preventScroll: true });
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) return toast.error("Paste a full image link starting with https://");
    if (imgs.some((i) => i.url === u)) return toast.error("That link is already added");
    if (imgs.length >= MAX_IMAGES) return toast.error(`Up to ${MAX_IMAGES} photos`);
    setImgs((l) => [...l, { url: u, state: "checking" }]);
    setTouched((t) => ({ ...t, img: true }));
    setUrl("");
    setSaved("Unsaved changes");
    probe(u);
  };

  async function send(kind: "draft" | "submit") {
    setServerErrs([]);
    if (kind === "submit") {
      setForced(true);
      if (Object.keys(errs).length) {
        setTimeout(() => summaryRef.current?.focus(), 0);
        return;
      }
    } else if (!v.title.trim() || !v.sku.trim()) {
      toast.error("Add at least a title and your SKU to save a draft");
      return;
    }
    if (imgs.some((i) => i.state === "checking")) return toast.error("Wait for the photo checks to finish");
    setBusy(kind);
    try {
      // A suspended (INACTIVE) product asks to go back on sale; the reviewer sees the status change.
      const reqStatus = kind === "draft" ? "DRAFT" : "ACTIVE";
      const res = (await sellerService.submitRows([toRow(v, imgs, base, reqStatus)])).data.data!;
      handleReport(res, kind);
    } catch (e) {
      setServerErrs([errorText(e, "We couldn't send this product. Try again.")]);
      setTimeout(() => summaryRef.current?.focus(), 0);
    } finally {
      setBusy(null);
    }
  }

  function handleReport(r: SubmissionReport, kind: "draft" | "submit") {
    if (r.errors.length) {
      setServerErrs(r.errors.map((e) => e.reason));
      setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }
    if (r.submissions.length) {
      setDone({ kind: "submitted", reference: r.submissions[0].reference, title: v.title.trim(), sku: r.submissions[0].skus[0] ?? v.sku });
      window.scrollTo({ top: 0 });
      return;
    }
    if (r.draftsSaved.length) {
      setSaved("Draft saved just now");
      toast.success("Draft saved. Drafts aren't sent for review.");
      return;
    }
    if (r.stockUpdates.length) toast.success("Stock updated. Nothing else changed, so there's nothing to review.");
    else toast.success(kind === "draft" ? "Nothing to save" : "Nothing changed, so there's nothing to review.");
    setSaved("Saved");
  }

  if (done) {
    return (
      <div className="sp-card">
        <div className="sp-done-box">
          <span className="sp-big-ic sp-ok">
            <Ico name="check" />
          </span>
          <h2>{editing ? "Sent for review" : "Submitted for review"}</h2>
          <p>
            “{done.title}” is with our catalog team. We&apos;ll review within <b>2 business days</b> and email you when it&apos;s live
            or if anything needs changing.
          </p>
          <dl className="sp-kv" style={{ margin: "8px 0" }}>
            <dt>Reference</dt>
            <dd className="sp-mono">{done.reference}</dd>
            <dt>SKU</dt>
            <dd className="sp-mono">{done.sku}</dd>
            <dt>Status</dt>
            <dd>Submitted</dd>
            <dt>Review by</dt>
            <dd>{reviewBy()}</dd>
          </dl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <button type="button" className="sp-btn sp-btn-pri" onClick={() => window.location.assign("/merchant/add/product")}>
              <Ico name="plus" />
              Add another product
            </button>
            <Link className="sp-btn sp-btn-sec" href={`/merchant/submissions/${done.reference}`}>
              Track this submission
            </Link>
            <Link className="sp-btn sp-btn-sec" href="/merchant/products">
              My products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="sp-alert sp-alert-bad" role="alert">
        <Ico name="alert" />
        <span>{loadErr}</span>
      </div>
    );
  }
  if (!tree || (editing && !base)) return <Loading />;

  const errKeys = forced ? (Object.keys(errs) as Key[]) : [];
  const field = (k: keyof Values, label: ReactNode, input: ReactNode, opts: { full?: boolean; help?: ReactNode; extra?: ReactNode } = {}) => (
    <label className={`sp-field ${opts.full ? "sp-full" : ""}`} htmlFor={`sp-${k}`}>
      <span className="sp-lab">
        <span>{label}</span>
        {opts.extra}
      </span>
      {input}
      {opts.help ? (
        <span className="sp-help" id={`sp-${k}-h`}>
          {opts.help}
        </span>
      ) : null}
      <FieldError id={`sp-${k}-e`}>{show(k)}</FieldError>
    </label>
  );
  const inputProps = (k: keyof Values) => ({
    id: `sp-${k}`,
    className: "sp-inp",
    value: v[k],
    onChange: (e: { target: { value: string } }) => set(k)(e.target.value),
    onBlur: touch(k),
    "aria-invalid": !!show(k) || undefined,
    "aria-describedby": `sp-${k}-h sp-${k}-e`,
  });
  const req = <span className="sp-req">*</span>;
  const tl = v.title.trim().length;

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>{editing ? (isLive ? "Edit product" : "Fix and resubmit") : "Add one product"}</h1>
          <p>
            {editing
              ? isLive
                ? "Your edit is reviewed before it goes live. Until then, shoppers see the current version. Stock changes apply at once."
                : "Make the changes our team asked for, then send it back for review."
              : "Fields marked * are required. We check everything as you go, so there are no surprises after you submit."}
          </p>
        </div>
      </div>
      {editing && rows && rows.length > 1 ? (
        <div className="sp-alert sp-alert-info" style={{ marginBottom: 16 }}>
          <Ico name="info" />
          <span>
            Editing SKU <b className="sp-mono">{base?.SKU_ID}</b>. Other SKUs:{" "}
            {rows
              .filter((r) => r.SKU_ID !== base?.SKU_ID)
              .map((r, i) => (
                <span key={r.SKU_ID}>
                  {i ? ", " : ""}
                  <button type="button" className="sp-lnk" onClick={() => loadRow(r)}>
                    {r.SKU_ID}
                  </button>
                </span>
              ))}
          </span>
        </div>
      ) : null}

      <div ref={summaryRef} tabIndex={-1} style={{ outline: "none" }}>
        {errKeys.length || serverErrs.length ? (
          <div className="sp-alert sp-alert-bad sp-errsum" role="alert">
            <Ico name="alert" />
            <div>
              <b>
                {serverErrs.length
                  ? "Our checks found a problem"
                  : `${errKeys.length} thing${errKeys.length > 1 ? "s" : ""} to fix before you can submit`}
              </b>
              <ul>
                {serverErrs.map((m) => (
                  <li key={m}>{m}</li>
                ))}
                {errKeys.map((k) => (
                  <li key={k}>
                    <button type="button" onClick={() => jump(k === "img" ? "sp-iurl" : k === "dim" ? "sp-l" : `sp-${k}`)}>
                      {LABELS[k]}: {errs[k]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <form
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void send("submit");
        }}
      >
        <div className="sp-form-lay">
          <div className="sp-sections">
            <section className="sp-card" aria-labelledby="s1h">
              <div className={`sp-sec-h ${secOk(SECS[0].keys) ? "sp-ok" : ""}`}>
                <span className="sp-n">1</span>
                <div>
                  <h2 id="s1h">Basic details</h2>
                  <p className="sp-cd">How shoppers will find and recognise your product.</p>
                </div>
              </div>
              <div className="sp-g2">
                {field("title", <>Product title {req}</>, <input {...inputProps("title")} maxLength={200} placeholder="e.g. Linen Table Lamp with Fabric Shade, Sand" />, {
                  full: true,
                  help: "10–150 characters. Say what it is, plus key details like material, size or colour.",
                  extra: <span className={`sp-counter ${tl > 150 || (tl > 0 && tl < 10) ? "sp-bad" : ""}`}>{tl} / 150</span>,
                })}
                {field("brand", <>Brand {req}</>, <input {...inputProps("brand")} maxLength={100} placeholder="e.g. Northwind Home" />)}
                {field(
                  "sku",
                  <>Your SKU {editing ? null : req}</>,
                  <input {...inputProps("sku")} readOnly={editing} maxLength={100} placeholder="e.g. NW-LMP-0150" style={{ fontFamily: "ui-monospace,Menlo,monospace" }} />,
                  { help: editing ? "SKUs can't be changed." : "Your own product code. We use it to match stock and orders." }
                )}
                {field(
                  "cat",
                  <>Category {req}</>,
                  <select {...inputProps("cat")} onChange={(e) => { set("cat")(e.target.value); touch("cat")(); }}>
                    <option value="">Choose a category</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>,
                  { full: true }
                )}
                {field("desc", "Description", <textarea {...inputProps("desc")} maxLength={10000} placeholder="What makes it special, materials, care, what's in the box." />, {
                  full: true,
                  extra: <span className="sp-opt">Recommended</span>,
                })}
              </div>
            </section>

            <section className="sp-card" aria-labelledby="s2h">
              <div className={`sp-sec-h ${secOk(["img"]) ? "sp-ok" : ""}`}>
                <span className="sp-n">2</span>
                <div>
                  <h2 id="s2h">
                    Photos {req}
                  </h2>
                  <p className="sp-cd">
                    At least one, up to {MAX_IMAGES}. {MIN_PX} px or more on the longest side. The first photo is the main one.
                  </p>
                </div>
              </div>
              <div className="sp-urlrow" style={{ marginTop: 0 }}>
                <label className="sp-sr" htmlFor="sp-iurl">
                  Image link
                </label>
                <input
                  id="sp-iurl"
                  className="sp-inp"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  placeholder="Paste an image link (https://…)"
                />
                <button className="sp-btn sp-btn-sec" type="button" onClick={addUrl}>
                  Add link
                </button>
              </div>
              <p className="sp-help" style={{ marginTop: 8 }}>
                Host your photos (your website, a CDN or cloud storage) and paste the public links. JPG, PNG or WebP.
              </p>
              {imgs.length ? (
                <div className="sp-thumbs">
                  {imgs.map((it, i) => (
                    <div className="sp-thumb" key={it.url}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- seller-supplied URLs from any host */}
                      {it.state === "bad" ? <div className="sp-ph-img" role="img" aria-label={it.url} /> : <img src={it.url} alt={`Photo ${i + 1}`} />}
                      {i === 0 ? <span className="sp-main-tag">Main</span> : null}
                      <button
                        type="button"
                        className="sp-rm"
                        aria-label={`Remove photo ${i + 1}`}
                        onClick={() => {
                          setImgs((l) => l.filter((x) => x.url !== it.url));
                          setSaved("Unsaved changes");
                        }}
                      >
                        <Ico name="x" />
                      </button>
                      <div className="sp-meta">
                        {it.state === "checking" ? (
                          <span>Checking…</span>
                        ) : it.state === "ok" ? (
                          <span className="sp-good">✓ {it.dims}</span>
                        ) : it.state === "small" ? (
                          <span className="sp-bad">Too small · {it.dims}</span>
                        ) : (
                          <span className="sp-bad">Link not found</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {show("img") ? (
                <span style={{ display: "block", marginTop: 10 }}>
                  <FieldError id="sp-img-e">{show("img")}</FieldError>
                </span>
              ) : null}
            </section>

            <section className="sp-card" aria-labelledby="s3h">
              <div className={`sp-sec-h ${secOk(SECS[2].keys) ? "sp-ok" : ""}`}>
                <span className="sp-n">3</span>
                <div>
                  <h2 id="s3h">Price and stock</h2>
                  <p className="sp-cd">Your price must be at or below the MRP. Stock updates go live right away; price changes are reviewed.</p>
                </div>
              </div>
              <div className="sp-g2">
                {field(
                  "price",
                  <>Your price {req}</>,
                  <span className="sp-unit sp-pre">
                    <span>$</span>
                    <input {...inputProps("price")} inputMode="decimal" placeholder="0.00" />
                  </span>
                )}
                {field(
                  "mrp",
                  <>MRP {req}</>,
                  <span className="sp-unit sp-pre">
                    <span>$</span>
                    <input {...inputProps("mrp")} inputMode="decimal" placeholder="0.00" />
                  </span>,
                  { extra: <span className="sp-opt">Maximum retail price</span> }
                )}
                {field(
                  "stock",
                  <>Stock available {req}</>,
                  <span className="sp-unit">
                    <input {...inputProps("stock")} inputMode="numeric" placeholder="0" />
                    <span>units</span>
                  </span>
                )}
              </div>
            </section>

            <section className="sp-card" aria-labelledby="s4h">
              <div className={`sp-sec-h ${secOk(["weight", "dim", "origin", "fiber"]) ? "sp-ok" : ""}`}>
                <span className="sp-n">4</span>
                <div>
                  <h2 id="s4h">Shipping and compliance</h2>
                  <p className="sp-cd">Needed to calculate delivery and to meet US labelling rules.</p>
                </div>
              </div>
              <div className="sp-g2">
                {field(
                  "weight",
                  <>Packed weight {req}</>,
                  <span className="sp-unit">
                    <input {...inputProps("weight")} inputMode="decimal" placeholder="0.0" />
                    <span>lb</span>
                  </span>
                )}
                <fieldset className="sp-field">
                  <legend className="sp-lab" style={{ marginBottom: 6 }}>
                    <span>Packed size (L × W × H) {req}</span>
                  </legend>
                  <div className="sp-g3">
                    {(["l", "w", "h"] as const).map((k) => (
                      <span className="sp-unit" key={k}>
                        <input
                          id={`sp-${k}`}
                          className="sp-inp"
                          inputMode="decimal"
                          value={v[k]}
                          placeholder={k.toUpperCase()}
                          aria-label={`${{ l: "Length", w: "Width", h: "Height" }[k]} in inches`}
                          aria-invalid={!!show("dim") || undefined}
                          onChange={(e) => set(k)(e.target.value)}
                          onBlur={touch("dim")}
                        />
                        <span>in</span>
                      </span>
                    ))}
                  </div>
                  <FieldError id="sp-dim-e">{show("dim")}</FieldError>
                </fieldset>
                {field(
                  "origin",
                  <>Country of origin {req}</>,
                  <select {...inputProps("origin")} onChange={(e) => { set("origin")(e.target.value); touch("origin")(); }}>
                    <option value="">Where it was made</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>,
                  { help: "Shown on the product page, as US law requires." }
                )}
                {field(
                  "fiber",
                  <>Fiber content {apparel ? req : null}</>,
                  <input {...inputProps("fiber")} maxLength={100} placeholder={apparel ? "e.g. 60% cotton, 40% polyester" : "Not needed for this category"} />,
                  { help: "Required for all clothing.", extra: <span className="sp-opt">{apparel ? "Required for this category" : "Clothing only"}</span> }
                )}
              </div>
            </section>
          </div>

          <aside className="sp-summary" aria-label="Progress">
            <div className="sp-card">
              <h2 style={{ fontSize: 16 }}>Ready to submit?</h2>
              <p className="sp-cd">
                {doneCount} of {SECS.length} required sections done
              </p>
              <div className="sp-prog" style={{ margin: "10px 0 14px" }}>
                <i style={{ width: `${(doneCount / SECS.length) * 100}%` }} />
              </div>
              <ul className="sp-chk">
                {SECS.map((s) => (
                  <li key={s.name} className={secOk(s.keys) ? "sp-ok" : ""}>
                    <i aria-hidden="true" />
                    <button type="button" onClick={() => jump(s.anchor)}>
                      {s.name}
                    </button>
                    <span className="sp-sr">{secOk(s.keys) ? " done" : " not done"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sp-card" style={{ padding: 18 }}>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                <b style={{ color: "var(--ink)" }}>After you submit:</b> our catalog team reviews it within 2 business days. If
                something needs fixing, you&apos;ll get notes and can edit and resubmit.
              </p>
            </div>
          </aside>
        </div>
        <div className="sp-actionbar">
          <span className="sp-note">{saved}</span>
          {isLive ? null : (
            <button className="sp-btn sp-btn-sec" type="button" disabled={!!busy} onClick={() => send("draft")}>
              {busy === "draft" ? "Saving…" : "Save as draft"}
            </button>
          )}
          <button className="sp-btn sp-btn-grn" disabled={!!busy}>
            {busy === "submit" ? (
              <>
                <span className="sp-spin" />
                Submitting…
              </>
            ) : isLive ? (
              "Submit change for review"
            ) : editing ? (
              "Resubmit for review"
            ) : (
              "Submit for review"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
