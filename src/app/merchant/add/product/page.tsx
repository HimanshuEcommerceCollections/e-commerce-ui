"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/seller/ProductForm";
import { Loading } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";

/** /merchant/add/product, or ?edit=<parent product id>[&sku=…] to fix or change one. */
export default function AddProductPage() {
  const [editId, setEditId] = useState<string | null | undefined>(undefined);
  useTitle(editId ? "Edit product" : "Add one product");
  useEffect(() => {
    setEditId(new URLSearchParams(window.location.search).get("edit"));
  }, []);

  return (
    <>
      <p className="sp-crumb">
        {editId ? <Link href="/merchant/products">My products</Link> : <Link href="/merchant/add">Add products</Link>} /{" "}
        {editId ? "Edit product" : "Add one product"}
      </p>
      {editId === undefined ? <Loading /> : <ProductForm key={editId ?? "new"} editId={editId} />}
    </>
  );
}
