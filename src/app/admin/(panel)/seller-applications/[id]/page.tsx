"use client";
import { SupplierDetail } from "@/components/admin/suppliers/SupplierDetail";

/** One supplier application: scorecard, documents, screening and the decision. */
export default function AdminSellerApplicationPage({ params }: { params: { id: string } }) {
  return <SupplierDetail id={params.id} />;
}
