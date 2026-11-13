"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import sellerService from "@/services/seller/seller.service";
import type { SellerProduct } from "@/types/api/seller.types";
import { Dialog, FieldError, Ico, Thumb, errorText } from "./ui";

/** "Update stock": applies at once, no review (POST /api/seller/stock). */
export function StockDialog({
  product,
  sku,
  onClose,
  onSaved,
}: {
  product: SellerProduct | null;
  sku?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [chosen, setChosen] = useState("");
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const variant = product?.variants.find((v) => v.sku === chosen) ?? product?.variants[0];

  useEffect(() => {
    if (!product) return;
    const v = product.variants.find((x) => x.sku === sku) ?? product.variants.find((x) => x.stockQuantity === 0) ?? product.variants[0];
    setChosen(v?.sku ?? "");
    setValue(String(v?.stockQuantity ?? ""));
    setErr("");
    setTimeout(() => input.current?.select(), 0);
  }, [product, sku]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!variant) return;
    const v = value.trim();
    if (!/^\d+$/.test(v)) {
      setErr("Enter a whole number, 0 or more");
      return input.current?.focus();
    }
    setBusy(true);
    try {
      const res = (await sellerService.updateStock([{ sku: variant.sku, quantity: Number(v) }])).data.data!;
      if (res.errors.length) throw new Error(res.errors[0].reason);
      toast.success(Number(v) === 0 ? "Saved. It now shows as out of stock." : "Stock updated. Live on the store now.");
      onSaved();
      onClose();
    } catch (e2) {
      setErr(errorText(e2, "We couldn't save the stock. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!product} onClose={onClose} label="Update stock">
      {product && variant ? (
        <form onSubmit={save} noValidate>
          <div className="sp-dh">
            <h2>Update stock</h2>
            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" aria-label="Close" onClick={onClose}>
              <Ico name="x" />
            </button>
          </div>
          <div className="sp-dp">
            <Thumb src={product.imageUrl} size={48} />
            <div style={{ minWidth: 0 }}>
              <b>{product.name}</b>
              <small className="sp-mono sp-muted">{variant.sku}</small>
            </div>
          </div>
          {product.variants.length > 1 ? (
            <label className="sp-field" htmlFor="sp-stk-sku">
              <span className="sp-lab">Variant</span>
              <select
                id="sp-stk-sku"
                className="sp-inp"
                value={variant.sku}
                onChange={(e) => {
                  const v = product.variants.find((x) => x.sku === e.target.value)!;
                  setChosen(v.sku);
                  setValue(String(v.stockQuantity));
                  setErr("");
                }}
              >
                {product.variants.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {v.variantName ? `${v.variantName} · ` : ""}
                    {v.sku} ({v.stockQuantity} in stock)
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="sp-field" htmlFor="sp-stk">
            <span className="sp-lab">Units available now</span>
            <input
              ref={input}
              id="sp-stk"
              className="sp-inp"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
              aria-invalid={!!err || undefined}
              aria-describedby="sp-stk-h sp-stk-e"
            />
            <span className="sp-help" id="sp-stk-h">
              Currently {variant.stockQuantity}. Goes live right away and is saved in your stock history.
            </span>
            <FieldError id="sp-stk-e">{err}</FieldError>
          </label>
          <div className="sp-df">
            <button type="button" className="sp-btn sp-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="sp-btn sp-btn-pri" disabled={busy}>
              {busy ? "Saving…" : "Save stock"}
            </button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
