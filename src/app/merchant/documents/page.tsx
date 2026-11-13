"use client";
import { DocumentsPanel } from "@/components/seller/DocumentsPanel";
import { useTitle } from "@/components/seller/useSellerSession";

export default function SellerDocumentsPage() {
  useTitle("Documents");
  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Documents</h1>
          <p>
            The paperwork we keep on file for your account. Upload a new copy when one expires or wasn&apos;t accepted; our team checks
            each one.
          </p>
        </div>
      </div>
      <section className="sp-card" aria-label="Your documents">
        <DocumentsPanel />
      </section>
    </>
  );
}
