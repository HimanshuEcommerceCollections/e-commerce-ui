import { Suspense } from "react";
import type { Metadata } from "next";
import { DataExportDownload } from "@/components/daylora/account/DataExportDownload";

export const metadata: Metadata = { title: "Download your data", robots: { index: false } };

type Props = { params: { id: string } };

/** The emailed data-export link (/account/data-export/:id?token=…). */
export default function DataExportPage({ params }: Props) {
  return (
    <Suspense fallback={<main id="main" className="cx pg auth" />}>
      <DataExportDownload id={params.id} />
    </Suspense>
  );
}
