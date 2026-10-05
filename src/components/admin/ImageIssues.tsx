"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ImageIssuePage } from "@/types/api/admin.types";
import { Drawer, Icon, Pager, ProductPill, rangeText, toast, whenText } from "./ui";

const SIZE = 20;

/** Broken image URLs across the catalog, with a re-check (FR-IM-08). */
export default function ImageIssues({
  open,
  onClose,
  onOpenProduct,
  onChecked,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (parentId: string) => void;
  onChecked: () => void;
}) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ImageIssuePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.imageIssues({ page, size: SIZE });
      setData(r.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't load image issues"));
    }
  }, [page]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const recheck = async (scope: "problems" | "all") => {
    setBusy(true);
    try {
      const r = (await adminService.recheckImages(scope)).data.data!;
      toast(r.enabled ? `Checked ${r.checked} images: ${r.broken} broken` : "Image checks are switched off on the server");
      if (page) setPage(0);
      else await load();
      onChecked();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't re-check the images"), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Image issues"
      sub={data ? `${data.totalElements} broken image URLs${data.uncheckedImages ? ` · ${data.uncheckedImages} not checked yet` : ""}` : null}
      foot={
        <>
          <button className="btn btn-secondary" onClick={() => recheck("all")} disabled={busy}>Re-check all</button>
          <button className="btn btn-primary" onClick={() => recheck("problems")} disabled={busy}>
            <Icon name="refresh" />
            {busy ? "Checking…" : "Re-check broken"}
          </button>
        </>
      }
    >
      <div className="note">
        <Icon name="info" />
        <span>
          Products with a broken image stay importable and live; fix the URL in the catalog sheet and re-import, then re-check.
        </span>
      </div>
      {error ? <p className="err-text">{error}</p> : null}
      {!data ? (
        error ? null : <p className="sub">Loading…</p>
      ) : data.content.length === 0 ? (
        <p className="sub">No broken images.</p>
      ) : (
        <>
          <div className="items">
            {data.content.map((i) => (
              <div className="item" key={i.imageId} style={{ alignItems: "flex-start" }}>
                <Icon name="image" className="bad-ic" />
                <div>
                  <button className="link" style={{ textAlign: "left" }} onClick={() => onOpenProduct(i.parentId)}>
                    {i.productName}
                  </button>
                  <span className="sub" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 2 }}>
                    <code>{i.sku}</code> image {i.position + 1} <ProductPill status={i.status} />
                  </span>
                  <span className="err-text" style={{ display: "block", marginTop: 4 }}>{i.error ?? "Broken"}</span>
                  <a className="sub url" href={i.url} target="_blank" rel="noreferrer">{i.url}</a>
                  <span className="sub">Checked {whenText(i.checkedAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="tfoot" style={{ padding: 0 }}>
            <span>{rangeText(page, SIZE, data.content.length, data.totalElements, "images")}</span>
            <Pager page={page} pages={data.totalPages} onPage={setPage} />
          </div>
        </>
      )}
    </Drawer>
  );
}
