"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import integrationService from "@/services/admin/integration.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ConnectionResult, Integration, IntegrationInput, IntegrationProvider, IntegrationSecretSpec } from "@/types/api/integration.types";
import { Drawer, Icon, toast, usePageTitle, whenText } from "@/components/admin/ui";
import { refreshAdminIntegrations } from "@/components/admin/refresh";

const SECRET_NAME = /^[A-Z][A-Z0-9_]{0,63}$/;

/** Per-field messages from a 400, keyed by field name. */
const fieldErrors = (err: unknown): Record<string, string> => {
  const r = (err as { response?: { status?: number; data?: { data?: unknown } } })?.response;
  return r?.status === 400 && r.data?.data && typeof r.data.data === "object" ? (r.data.data as Record<string, string>) : {};
};

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <Integrations />
    </Suspense>
  );
}

/** Admin › Settings › API integrations: every vendor connection and its encrypted secrets (admin only). */
function Integrations() {
  usePageTitle("API integrations");
  const params = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<Integration[] | null>(null);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Integration | { add: string | null } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, provs] = await Promise.all([integrationService.list(), integrationService.providers()]);
      setRows(list.data.data ?? []);
      setProviders(provs.data.data ?? []);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load the integrations"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // Deep links from an integration's tab: ?edit=<slug>, ?add=<PROVIDER>.
  useEffect(() => {
    if (!rows) return;
    const edit = params.get("edit");
    const add = params.get("add");
    if (edit) {
      const row = rows.find((r) => r.slug === edit);
      if (row) setEditing(row);
    } else if (add) {
      const existing = rows.find((r) => r.provider === add && providers.find((p) => p.id === add)?.single);
      setEditing(existing ?? { add });
    }
    if (edit || add) router.replace("/admin/integrations");
  }, [rows, providers, params, router]);

  const changed = () => {
    setEditing(null);
    load();
    refreshAdminIntegrations();
  };

  return (
    <section aria-labelledby="h-integrations">
      <div className="page-head">
        <div>
          <h1 id="h-integrations">API integrations</h1>
          <p>Connect vendor APIs. Each enabled integration gets its own tab in the sidebar. Secrets are stored encrypted and never shown again in full.</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setEditing({ add: null })}>
            <Icon name="plus" />
            Add integration
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Integration</th>
                <th>Type</th>
                <th>Secrets</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={5}>Loading integrations…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={5}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>No integrations yet. Use Add integration to connect a vendor such as Gooten.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="click" tabIndex={0} onClick={() => setEditing(r)} onKeyDown={(e) => e.key === "Enter" && setEditing(r)}>
                    <td>
                      <strong>{r.name}</strong>
                      <div className="sub trunc">{r.baseUrl ?? "No base URL"}</div>
                    </td>
                    <td>{r.providerLabel}</td>
                    <td className="sub">
                      {!r.secretsReadable ? (
                        <span className="err-text">Can&apos;t be read: enter them again</span>
                      ) : r.secrets.length ? (
                        r.secrets.map((s) => (
                          <div key={s.name}>
                            <code>{s.name}</code> {s.hint}
                          </div>
                        ))
                      ) : (
                        "None"
                      )}
                      {r.missingSecrets.length ? <div className="err-text">Missing: {r.missingSecrets.join(", ")}</div> : null}
                    </td>
                    <td>
                      {r.enabled ? <span className="pill p-ok">Enabled</span> : <span className="pill p-grey">Disabled</span>}
                      {r.enabled ? (
                        <div className="sub">
                          <Link className="link" href={`/admin/vendors/${r.slug}`} onClick={(e) => e.stopPropagation()}>Open tab</Link>
                        </div>
                      ) : null}
                    </td>
                    <td className="sub">
                      {whenText(r.updatedAt)}
                      {r.updatedBy ? <div>{r.updatedBy}</div> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IntegrationDrawer
        target={editing}
        providers={providers}
        existing={rows ?? []}
        onClose={() => setEditing(null)}
        onChanged={changed}
      />
    </section>
  );
}

interface NewSecret {
  key: number;
  name: string;
  value: string;
}

function IntegrationDrawer({
  target,
  providers,
  existing,
  onClose,
  onChanged,
}: {
  target: Integration | { add: string | null } | null;
  providers: IntegrationProvider[];
  existing: Integration[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const current = target && "id" in target ? target : null;
  const [providerId, setProviderId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [notes, setNotes] = useState("");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  /** Typed values for named secrets; "" leaves the stored value alone. */
  const [values, setValues] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<NewSecret[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);

  const provider = providers.find((p) => p.id === (current?.provider ?? providerId)) ?? null;

  useEffect(() => {
    setErrors({});
    setResult(null);
    setValues({});
    setRemoved(new Set());
    setExtra([]);
    if (!target) return;
    if ("id" in target) {
      setProviderId(target.provider);
      setName(target.name);
      setBaseUrl(target.baseUrl ?? "");
      setEnabled(target.enabled);
      setNotes(target.notes ?? "");
      setSettings(target.settings ?? {});
    } else {
      setProviderId(target.add);
      setEnabled(true);
      setNotes("");
      setSettings({});
      const p = providers.find((x) => x.id === target.add);
      setName(p && p.id !== "CUSTOM" ? p.label : "");
      setBaseUrl(p?.defaultBaseUrl ?? "");
    }
  }, [target, providers]);

  const choose = (p: IntegrationProvider) => {
    setProviderId(p.id);
    setName(p.id === "CUSTOM" ? "" : p.label);
    setBaseUrl(p.defaultBaseUrl ?? "");
    setSettings({});
  };

  const stored = current?.secretsReadable ? current.secrets : [];
  const storedNames = new Set(stored.map((s) => s.name));
  // Named fields: the provider's own, then (custom) every stored secret.
  const named: IntegrationSecretSpec[] = provider
    ? [
        ...provider.secrets,
        ...(provider.freeformSecrets ? stored.filter((s) => !provider.secrets.some((x) => x.name === s.name)).map((s) => ({ name: s.name, label: s.name })) : []),
      ]
    : [];

  const save = async () => {
    if (!provider) return;
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Enter a name";
    if (provider.baseUrlRequired && !baseUrl.trim()) e.baseUrl = "Enter the API base URL";
    if (baseUrl.trim() && !/^https?:\/\//i.test(baseUrl.trim())) e.baseUrl = "Start with http:// or https://";
    for (const s of provider.secrets) {
      if (s.required && !values[s.name]?.trim() && (!storedNames.has(s.name) || removed.has(s.name))) e[`secret.${s.name}`] = `${s.label} is required`;
    }
    const seen = new Set(named.map((n) => n.name));
    extra.forEach((x) => {
      if (!x.name && !x.value) return;
      if (!SECRET_NAME.test(x.name)) e[`extra.${x.key}`] = "Use UPPER_SNAKE_CASE, e.g. API_KEY";
      else if (seen.has(x.name)) e[`extra.${x.key}`] = "This name is already used";
      else if (!x.value.trim()) e[`extra.${x.key}`] = "Enter a value";
      seen.add(x.name);
    });
    setErrors(e);
    if (Object.keys(e).length) return;

    const secrets: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(values)) if (v.trim()) secrets[k] = v.trim();
    removed.forEach((k) => {
      if (!secrets[k]) secrets[k] = null;
    });
    extra.forEach((x) => {
      if (x.name && x.value.trim()) secrets[x.name] = x.value.trim();
    });
    const body: IntegrationInput = {
      name: name.trim(),
      enabled,
      baseUrl: baseUrl.trim() || null,
      settings,
      notes: notes.trim() || null,
      secrets,
    };
    setBusy(true);
    try {
      if (current) await integrationService.update(current.slug, body);
      else await integrationService.create({ ...body, provider: provider.id });
      toast(`${body.name} ${current ? "saved" : "added"}`);
      onChanged();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      toast(Object.values(fe)[0] ?? getApiErrorMessage(err, "Couldn't save the integration"), true);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    if (!current) return;
    setTesting(true);
    setResult(null);
    try {
      setResult((await integrationService.test(current.slug)).data.data);
    } catch (err) {
      setResult({ ok: false, message: getApiErrorMessage(err, "The test failed") });
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    if (!current) return;
    if (!window.confirm(`Remove ${current.name}? Its secrets are deleted and its tab disappears. Products already imported stay in the catalog.`)) return;
    setBusy(true);
    try {
      await integrationService.remove(current.slug);
      toast(`${current.name} removed`);
      onChanged();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't remove the integration"), true);
    } finally {
      setBusy(false);
    }
  };

  const setSetting = (k: string, v: unknown) => setSettings((s) => ({ ...s, [k]: v }));
  const choosing = !!target && !current && !provider;

  return (
    <Drawer
      open={!!target}
      onClose={onClose}
      title={current ? current.name : provider ? `Add ${provider.label}` : "Add integration"}
      sub={current ? `${current.providerLabel} · /admin/vendors/${current.slug}` : provider?.description}
      foot={
        choosing ? (
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        ) : (
          <>
            {current ? <button className="btn btn-danger" onClick={remove} disabled={busy}>Remove</button> : null}
            {current ? (
              <button className="btn btn-secondary" onClick={test} disabled={testing || busy}>
                {testing ? "Testing…" : "Test connection"}
              </button>
            ) : null}
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : current ? "Save changes" : "Add integration"}</button>
          </>
        )
      }
    >
      {choosing ? (
        <div className="form">
          <p className="sub">What kind of vendor are you connecting?</p>
          {providers.map((p) => {
            const taken = p.single && existing.some((r) => r.provider === p.id);
            return (
              <button
                key={p.id}
                type="button"
                className="vcard"
                style={{ textAlign: "left", width: "100%", opacity: taken ? 0.55 : 1 }}
                disabled={taken}
                onClick={() => choose(p)}
              >
                <strong>{p.label}</strong>
                <div className="sub">{taken ? "Already connected: edit it from the list." : p.description}</div>
                <div className="sub">{p.features.join(" · ")}</div>
              </button>
            );
          })}
        </div>
      ) : provider ? (
        <div className="form">
          {result ? (
            <div className="note" role="status">
              <span className={`pill ${result.ok ? "p-ok" : "p-bad"}`}>{result.ok ? "Connected" : "Failed"}</span> {result.message}
            </div>
          ) : null}
          {current && !current.secretsReadable ? (
            <div className="note"><span className="err-text">The stored secrets can&apos;t be decrypted (the encryption key changed). Enter them again and save.</span></div>
          ) : null}

          <div className="row2">
            <div className="fld">
              <label htmlFor="in-name">Name <span className="req">*</span></label>
              <input className={`inp ${errors.name ? "bad" : ""}`} id="in-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. Printful" />
              {errors.name ? <span className="err-text">{errors.name}</span> : <span className="hint">Shown as the sidebar tab.</span>}
            </div>
            <div className="fld">
              <label>Status</label>
              <label className="switch">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                {enabled ? "Enabled" : "Disabled"}
              </label>
              <span className="hint">Disabled integrations keep their secrets but lose their tab.</span>
            </div>
          </div>
          <div className="fld">
            <label htmlFor="in-url">API base URL {provider.baseUrlRequired ? <span className="req">*</span> : null}</label>
            <input
              className={`inp ${errors.baseUrl ? "bad" : ""}`}
              id="in-url"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider.defaultBaseUrl ?? "https://api.vendor.com"}
            />
            {errors.baseUrl ? <span className="err-text">{errors.baseUrl}</span> : null}
          </div>

          <div className="d-sec">
            <h3>Secrets</h3>
            <p className="sub">Stored encrypted. Leave a field blank to keep what&apos;s saved.</p>
            {named.map((s) => {
              const has = storedNames.has(s.name) && !removed.has(s.name);
              const hint = stored.find((x) => x.name === s.name)?.hint;
              const err = errors[`secret.${s.name}`];
              return (
                <div className="fld" key={s.name}>
                  <label htmlFor={`sec-${s.name}`}>
                    {s.label} {s.required ? <span className="req">*</span> : null} <code>{s.name}</code>
                  </label>
                  <div className="actrow" style={{ justifyContent: "flex-start", gap: 8 }}>
                    <input
                      className={`inp ${err ? "bad" : ""}`}
                      id={`sec-${s.name}`}
                      type="password"
                      autoComplete="new-password"
                      value={values[s.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [s.name]: e.target.value }))}
                      placeholder={has ? `Saved (${hint}). Type to replace` : "Not set"}
                      style={{ flex: 1 }}
                    />
                    {storedNames.has(s.name) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() =>
                          setRemoved((r) => {
                            const n = new Set(r);
                            if (n.has(s.name)) n.delete(s.name);
                            else n.add(s.name);
                            return n;
                          })
                        }
                      >
                        {removed.has(s.name) ? "Keep" : "Remove"}
                      </button>
                    ) : null}
                  </div>
                  {err ? (
                    <span className="err-text">{err}</span>
                  ) : removed.has(s.name) ? (
                    <span className="err-text">Will be removed when you save.</span>
                  ) : s.help ? (
                    <span className="hint">{s.help}</span>
                  ) : null}
                </div>
              );
            })}
            {provider.freeformSecrets ? (
              <>
                {extra.map((x) => (
                  <div className="fld" key={x.key}>
                    <div className="row2">
                      <input
                        className={`inp ${errors[`extra.${x.key}`] ? "bad" : ""}`}
                        aria-label="Secret name"
                        placeholder="API_KEY"
                        value={x.name}
                        onChange={(e) => setExtra((l) => l.map((y) => (y.key === x.key ? { ...y, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") } : y)))}
                      />
                      <div className="actrow" style={{ justifyContent: "flex-start", gap: 8 }}>
                        <input
                          className="inp"
                          aria-label="Secret value"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Value"
                          value={x.value}
                          style={{ flex: 1 }}
                          onChange={(e) => setExtra((l) => l.map((y) => (y.key === x.key ? { ...y, value: e.target.value } : y)))}
                        />
                        <button type="button" className="btn btn-sm btn-secondary" aria-label="Remove row" onClick={() => setExtra((l) => l.filter((y) => y.key !== x.key))}>
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    </div>
                    {errors[`extra.${x.key}`] ? <span className="err-text">{errors[`extra.${x.key}`]}</span> : null}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setExtra((l) => [...l, { key: Date.now(), name: "", value: "" }])}>
                  <Icon name="plus" size={16} />
                  Add secret
                </button>
              </>
            ) : null}
          </div>

          {provider.settings.length ? (
            <div className="d-sec">
              <h3>Settings</h3>
              {provider.settings.map((s) => {
                const v = settings[s.key] ?? s.default;
                const err = errors[`settings.${s.key}`];
                if (s.type === "boolean") {
                  return (
                    <div className="fld" key={s.key}>
                      <label className="switch">
                        <input type="checkbox" checked={v === true} onChange={(e) => setSetting(s.key, e.target.checked)} />
                        {s.label}
                      </label>
                      {err ? <span className="err-text">{err}</span> : s.help ? <span className="hint">{s.help}</span> : null}
                    </div>
                  );
                }
                return (
                  <div className="fld" key={s.key}>
                    <label htmlFor={`set-${s.key}`}>{s.label}</label>
                    {s.type === "select" ? (
                      <select className="sel inp" id={`set-${s.key}`} value={String(v ?? "")} onChange={(e) => setSetting(s.key, e.target.value)}>
                        {s.options!.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input className={`inp ${err ? "bad" : ""}`} id={`set-${s.key}`} value={String(v ?? "")} onChange={(e) => setSetting(s.key, e.target.value)} />
                    )}
                    {err ? <span className="err-text">{err}</span> : s.help ? <span className="hint">{s.help}</span> : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="fld">
            <label htmlFor="in-notes">Notes (optional)</label>
            <textarea className="inp" id="in-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Account owner, support contact, docs link…" />
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
