"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import integrationService from "@/services/admin/integration.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ConnectionResult, Integration, IntegrationNavItem } from "@/types/api/integration.types";
import { Icon, usePageTitle, whenText } from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";
import GootenPanel from "@/components/admin/integrations/GootenPanel";

/** An integration's own tab: the vendor's adapter screen, or the generic one for a custom API. */
export default function VendorTabPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<IntegrationNavItem | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItem(undefined);
    integrationService
      .nav()
      .then((r) => setItem((r.data.data ?? []).find((i) => i.slug === slug) ?? null))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load this integration")));
  }, [slug]);

  if (error) return <p className="err-text">{error}</p>;
  if (item === undefined) return <p className="sub">Loading…</p>;
  if (item === null) {
    return (
      <section>
        <div className="page-head">
          <div>
            <h1>Integration not found</h1>
            <p>It may have been removed or disabled. Check Settings › API integrations.</p>
          </div>
        </div>
      </section>
    );
  }
  if (item.provider === "GOOTEN") return <GootenPanel name={item.name} />;
  return <CustomPanel item={item} />;
}

/** CUSTOM vendors: connection details and a connection test; product/order features need an adapter. */
function CustomPanel({ item }: { item: IntegrationNavItem }) {
  usePageTitle(item.name);
  const { isAdmin } = useAdminSession();
  const [detail, setDetail] = useState<Integration | null>(null);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    integrationService
      .get(item.slug)
      .then((r) => setDetail(r.data.data))
      .catch(() => setDetail(null));
  }, [isAdmin, item.slug]);

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      setResult((await integrationService.test(item.slug)).data.data);
    } catch (err) {
      setResult({ ok: false, message: getApiErrorMessage(err, "The test failed") });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section aria-labelledby="h-vendor">
      <div className="page-head">
        <div>
          <h1 id="h-vendor">{item.name}</h1>
          <p>{item.providerLabel} integration.</p>
        </div>
        {isAdmin ? (
          <div className="actions">
            <button className="btn btn-secondary" onClick={test} disabled={testing}>
              <Icon name="refresh" />
              {testing ? "Testing…" : "Test connection"}
            </button>
            <Link className="btn btn-primary" href={`/admin/integrations?edit=${item.slug}`}>
              <Icon name="edit" />
              Edit
            </Link>
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="note" role="status" style={{ marginBottom: 24 }}>
          <span className={`pill ${result.ok ? "p-ok" : "p-bad"}`}>{result.ok ? "Connected" : "Failed"}</span> {result.message}
        </div>
      ) : null}

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="pad">
          {isAdmin && detail ? (
            <dl className="kv">
              <dt>Base URL</dt>
              <dd>{detail.baseUrl ? <code>{detail.baseUrl}</code> : "—"}</dd>
              <dt>Secrets</dt>
              <dd>
                {detail.secrets.length
                  ? detail.secrets.map((s) => (
                      <div key={s.name}>
                        <code>{s.name}</code> {s.hint}
                      </div>
                    ))
                  : "None"}
              </dd>
              <dt>Authentication</dt>
              <dd>{String(detail.settings.authType ?? "none")}{detail.settings.authSecret ? ` · ${String(detail.settings.authSecret)}` : ""}</dd>
              <dt>Notes</dt>
              <dd style={{ whiteSpace: "pre-line" }}>{detail.notes ?? "—"}</dd>
              <dt>Updated</dt>
              <dd>{whenText(detail.updatedAt)}{detail.updatedBy ? ` by ${detail.updatedBy}` : ""}</dd>
            </dl>
          ) : (
            <p className="sub">Connection details are visible to admins.</p>
          )}
        </div>
      </div>

      <div className="note">
        This vendor&apos;s credentials are stored and ready to use. Importing its products or sending it orders needs an adapter for its API,
        like the Gooten one. A developer adds it in <code>backend/src/integrations/providers.ts</code> and reads these secrets with{" "}
        <code>IntegrationService.resolve()</code>.
      </div>
    </section>
  );
}
