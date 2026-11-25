"use client";
import { useParams } from "next/navigation";
import { ContactProfile } from "@/components/admin/crm/Profile";

/** One customer: details, orders, tickets, tasks and the history of notes, calls and emails. */
export default function CrmCustomerPage() {
  const { id } = useParams<{ id: string }>();
  return <ContactProfile kind="customer" id={id} />;
}
