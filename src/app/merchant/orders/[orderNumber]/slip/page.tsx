"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { timeOf } from "@/components/seller/orders";
import { LoadError, Loading, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";

/** A packing slip to print and put in the parcel: ship-to and the items, no prices. */
export default function PackingSlipPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const number = decodeURIComponent(orderNumber);
  useTitle(`Packing slip ${number}`);
  const load = useLoad(() => sellerService.order(number), [number]);
  const o = load.data;

  useEffect(() => {
    if (o) setTimeout(() => window.print(), 300);
  }, [o]);

  if (load.error && !o) return <LoadError error={load.error} onRetry={load.reload} what="this order" />;
  if (!o) return <Loading />;

  return (
    <div className="sp-slip">
      <p className="sp-noprint" style={{ marginBottom: 16 }}>
        <Link href={`/merchant/orders/${encodeURIComponent(o.orderNumber)}`}>← Back to the order</Link>{" "}
        <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => window.print()} style={{ marginLeft: 8 }}>
          Print
        </button>
      </p>
      <header className="sp-slip-h">
        <div>
          <h1>Packing slip</h1>
          <p>
            Order <b>{o.orderNumber}</b> · placed {timeOf(o.paidAt)}
          </p>
        </div>
        <p className="sp-slip-brand">Ecommerce Collections</p>
      </header>
      <section className="sp-slip-to">
        <h2>Ship to</h2>
        <p>
          <b>{o.shipTo.name}</b>
          <br />
          {o.shipTo.addressLine1 ?? ""}
          {o.shipTo.addressLine2 ? `, ${o.shipTo.addressLine2}` : ""}
          <br />
          {o.shipTo.city}, {o.shipTo.state} {o.shipTo.postalCode}
          {o.shipTo.country ? (
            <>
              <br />
              {o.shipTo.country}
            </>
          ) : null}
          {o.shipTo.phone ? (
            <>
              <br />
              {o.shipTo.phone}
            </>
          ) : null}
        </p>
      </section>
      <table className="sp-slip-t">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item</th>
            <th className="sp-r">Qty</th>
          </tr>
        </thead>
        <tbody>
          {o.lines.map((l) => (
            <tr key={l.sku}>
              <td className="sp-mono">{l.sku}</td>
              <td>
                {l.productName}
                {l.variantName ? ` · ${l.variantName}` : ""}
              </td>
              <td className="sp-r">{l.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sp-slip-f">Thank you for shopping with Ecommerce Collections. Questions or returns: visit your account at our store.</p>
    </div>
  );
}
