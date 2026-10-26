"use client";

import Link from "next/link";
import { useState } from "react";
import { DayloraIcon } from "../DayloraIcons";
import orderService from "@/services/order.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import { fmtLong, money, useAccountToast, variantText } from "./customerShared";
import { OrderStates, orderHref, paymentText, useOrder } from "./AccountOrders";

/** "EC-4821907" → "INV-4821907". */
const invoiceNumber = (orderNumber: string) => `INV-${orderNumber.replace(/^[A-Z]+-/, "")}`;

/** /account/orders/[idOrNumber]/invoice: printable invoice (print CSS hides the site chrome). */
export function InvoiceView({ orderRef, onLoaded }: { orderRef: string; onLoaded: (orderNumber: string) => void }) {
  const toast = useAccountToast();
  const user = useAuthStore((s) => s.user);
  const config = useStoreConfig();
  const { order, missing, error, reload } = useOrder(orderRef, onLoaded);
  const [sending, setSending] = useState(false);

  const back = (
    <Link href={orderHref({ orderNumber: order?.orderNumber ?? orderRef })} className="back-link">
      <DayloraIcon name="arrow" />
      Order {order?.orderNumber ?? orderRef}
    </Link>
  );
  if (!order) return <OrderStates orderRef={orderRef} missing={missing} error={error} retry={reload} back={back} />;

  const a = order.shippingAddress;
  const c = order.currency;
  const email = order.customerEmail ?? user?.email ?? "";

  async function emailCopy() {
    if (!order) return;
    setSending(true);
    try {
      await orderService.emailInvoice(order.id);
      toast({ title: "Invoice sent", body: email ? `Check ${email}.` : undefined });
    } catch (e) {
      toast({ title: "Couldn't email the invoice", body: getApiErrorMessage(e, "Try again in a moment.") });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {back}
      <article className="inv" aria-label={`Invoice for order ${order.orderNumber}`}>
        <div className="inv-top">
          <div>
            <p className="inv-brand">{config?.storeName ?? "Ecommerce Collections"}</p>
            <small>Sold and shipped by {config?.storeName ?? "Ecommerce Collections"}</small>
          </div>
          <dl className="inv-meta">
            <dt>Invoice</dt>
            <dd className="mono">{invoiceNumber(order.orderNumber)}</dd>
            <dt>Order</dt>
            <dd className="mono">{order.orderNumber}</dd>
            <dt>Date</dt>
            <dd>{fmtLong(order.createdAt)}</dd>
            <dt>Paid with</dt>
            <dd>{paymentText(order)}</dd>
          </dl>
        </div>
        <div className="inv-parties">
          <div>
            <h3>Bill to</h3>
            <address className="addr">
              {a.recipientName}
              {email && (
                <>
                  <br />
                  {email}
                </>
              )}
            </address>
          </div>
          <div>
            <h3>Ship to</h3>
            <address className="addr">
              {a.recipientName}
              <br />
              {[a.addressLine1, a.addressLine2].filter(Boolean).join(", ")}
              <br />
              {a.city}, {a.state} {a.postalCode}
            </address>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th className="n">Qty</th>
                <th className="n">Price</th>
                <th className="n">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <b>{i.productName}</b>
                    {variantText(i) && (
                      <>
                        <br />
                        <span className="note-sm">{variantText(i)}</span>
                      </>
                    )}
                  </td>
                  <td className="n">{i.quantity}</td>
                  <td className="n">{money(i.unitPrice, c)}</td>
                  <td className="n">{money(i.lineTotal, c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="kv inv-tot">
          <dt>Subtotal</dt>
          <dd>{money(order.subtotal, c)}</dd>
          {order.discountTotal > 0 && (
            <>
              <dt>Promo{order.promoCode ? ` ${order.promoCode}` : ""}</dt>
              <dd>−{money(order.discountTotal, c)}</dd>
            </>
          )}
          <dt>Shipping{order.shippingMethod ? ` (${order.shippingMethod === "EXPRESS" ? "Express" : "Standard"})` : ""}</dt>
          <dd>{order.shippingTotal ? money(order.shippingTotal, c) : "Free"}</dd>
          <dt>Sales tax</dt>
          <dd>{money(order.taxTotal, c)}</dd>
          <dt className="tot">{order.paymentStatus === "SUCCEEDED" || order.refundedTotal > 0 ? "Total paid" : "Total"}</dt>
          <dd className="tot">{money(order.grandTotal, c)}</dd>
          {order.refundedTotal > 0 && (
            <>
              <dt>Refunded</dt>
              <dd>−{money(order.refundedTotal, c)}</dd>
            </>
          )}
        </dl>
        <div className="help-row inv-acts">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <DayloraIcon name="file" />
            Print or save as PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={emailCopy} disabled={sending}>
            {sending ? "Sending…" : "Email me a copy"}
          </button>
        </div>
      </article>
    </>
  );
}
