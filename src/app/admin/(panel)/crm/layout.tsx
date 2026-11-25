import type { ReactNode } from "react";
import "../../_styles/crm.css";
import CrmShell from "@/components/admin/crm/CrmShell";

/** Admin › CRM: customers, suppliers and the tickets they raise (designs/crm). Admins only. */
export default function CrmLayout({ children }: { children: ReactNode }) {
  return <CrmShell>{children}</CrmShell>;
}
