"use client";
import Link from "next/link";
import { Ico, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import { useAuthStore } from "@/store/useAuthStore";

export default function AddProductsPage() {
  useTitle("Add products");
  const user = useAuthStore((s) => s.user);
  const catalog = useLoad(() => sellerService.catalog());
  const waiting = (catalog.data ?? []).filter((p) => p.state === "SUBMITTED" || p.state === "IN_REVIEW").length;
  const first = (user?.fullName ?? "").split(" ")[0];

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Add products</h1>
          <p>
            {first ? `Welcome, ${first}. ` : ""}Choose how you&apos;d like to add products. Everything you submit is reviewed by our
            catalog team within 2 business days before shoppers see it.
          </p>
        </div>
      </div>
      {waiting ? (
        <div className="sp-alert sp-alert-ok" style={{ marginBottom: 18 }}>
          <Ico name="check" />
          <span>
            You have <b>{waiting}</b> product{waiting === 1 ? "" : "s"} submitted and waiting for review.{" "}
            <Link href="/merchant/products?tab=inreview">See them</Link>
          </span>
        </div>
      ) : null}
      <div className="sp-choose">
        <Link className="sp-opt-card" href="/merchant/add/product">
          <span className="sp-ic" style={{ background: "var(--leaf-bg)", color: "var(--leaf)" }}>
            <Ico name="plus" />
          </span>
          <h2>Add one product</h2>
          <p>Fill in a form. Best for a few products or your first try.</p>
          <ul>
            <li>
              <Ico name="check" />
              Checks each field as you type
            </li>
            <li>
              <Ico name="check" />
              Paste image links and see them checked
            </li>
            <li>
              <Ico name="check" />
              Save as draft and finish later
            </li>
          </ul>
          <span className="sp-go">
            Start <Ico name="right" />
          </span>
        </Link>
        <Link className="sp-opt-card" href="/merchant/add/bulk">
          <span className="sp-ic" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
            <Ico name="sheet" />
          </span>
          <h2>Bulk upload</h2>
          <p>Upload a CSV or Excel file using our template. Best for many products.</p>
          <ul>
            <li>
              <Ico name="check" />
              Template with every column explained
            </li>
            <li>
              <Ico name="check" />
              Errors shown row by row before you submit
            </li>
            <li>
              <Ico name="check" />
              Good rows go through, the rest come back to fix
            </li>
          </ul>
          <span className="sp-go">
            Start <Ico name="right" />
          </span>
        </Link>
      </div>
      <div className="sp-tips">
        <div className="sp-tip">
          <span className="sp-ic">
            <Ico name="image" />
          </span>
          <span>
            <b>Photos</b>
            <p>At least one image, 1000 px or more on the longest side.</p>
          </span>
        </div>
        <div className="sp-tip">
          <span className="sp-ic">
            <Ico name="doc" />
          </span>
          <span>
            <b>Required details</b>
            <p>Country of origin on every product. Fiber content on clothing.</p>
          </span>
        </div>
        <div className="sp-tip">
          <span className="sp-ic">
            <Ico name="box" />
          </span>
          <span>
            <b>Shipping</b>
            <p>Weight and dimensions, so we can calculate delivery.</p>
          </span>
        </div>
      </div>
      <div className="sp-statebar" aria-label="Product states">
        <span>What happens next:</span>
        <span className="sp-s sp-on">Submitted</span>
        <Ico name="right" />
        <span className="sp-s">In review</span>
        <Ico name="right" />
        <span className="sp-s">Live</span>
        <span>· or “Changes requested” with notes from our team</span>
      </div>
    </>
  );
}
