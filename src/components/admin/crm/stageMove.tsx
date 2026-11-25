"use client";
import { useState, type ReactNode } from "react";
import crmService from "@/services/admin/crm.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/components/admin/ui";
import type { PipelineStage } from "@/types/api/crm.types";
import { useCrm } from "./CrmContext";
import { ConfirmPortalDialog, LostDialog } from "./dialogs";

interface Mover {
  id: string;
  company: string;
  stage: PipelineStage;
}

/**
 * Moving a supplier to another stage, as the design does it: "lost" asks why;
 * a stage the Seller Portal normally sets by itself asks for confirmation.
 * Returns `move` and the dialogs to render.
 */
export function useStageMover(onMoved: () => void): { move: (s: Mover, to: PipelineStage) => void; dialogs: ReactNode } {
  const { meta, changed } = useCrm();
  const [pending, setPending] = useState<{ kind: "lost" | "portal"; s: Mover; to: PipelineStage } | null>(null);
  const label = (s: PipelineStage) => meta.stages.find((x) => x.key === s)?.label ?? s;
  const auto = (s: PipelineStage) => meta.stages.find((x) => x.key === s)?.auto ?? false;

  const run = async (s: Mover, to: PipelineStage, extra: { reason?: string; note?: string } = {}) => {
    setPending(null);
    try {
      await crmService.moveSupplier(s.id, { stage: to, ...extra });
      toast(`${s.company} moved to ${label(to)}`);
      changed();
      onMoved();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't move the supplier."), true);
    }
  };

  const move = (s: Mover, to: PipelineStage) => {
    if (s.stage === to) return;
    if (to === "lost") return setPending({ kind: "lost", s, to });
    if (auto(to) && !auto(s.stage)) return setPending({ kind: "portal", s, to });
    void run(s, to);
  };

  const dialogs = pending ? (
    pending.kind === "lost" ? (
      <LostDialog open company={pending.s.company} onClose={() => setPending(null)} onConfirm={(reason, note) => run(pending.s, "lost", { reason, note: note || undefined })} />
    ) : (
      <ConfirmPortalDialog open stage={label(pending.to)} onClose={() => setPending(null)} onConfirm={() => run(pending.s, pending.to)} />
    )
  ) : null;
  return { move, dialogs };
}
