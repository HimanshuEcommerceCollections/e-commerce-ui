"use client";
import { useParams } from "next/navigation";
import { ContactProfile } from "@/components/admin/crm/Profile";

/** One supplier: pipeline stage, next step, tickets, tasks and the history of notes, calls and emails. */
export default function CrmSupplierPage() {
  const { id } = useParams<{ id: string }>();
  return <ContactProfile kind="supplier" id={id} />;
}
