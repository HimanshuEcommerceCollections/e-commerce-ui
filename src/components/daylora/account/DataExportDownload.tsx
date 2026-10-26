"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import privacyService from "@/services/account/privacy.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";

type State = "idle" | "busy" | "done" | "error";

/**
 * The emailed data-export link (/account/data-export/:id?token=…). The file is
 * served only to the signed-in owner, so a signed-out visitor signs in first
 * and comes straight back here.
 */
export function DataExportDownload({ id }: { id: string }) {
  const token = useSearchParams().get("token") ?? "";
  const here = `${usePathname()}?token=${encodeURIComponent(token)}`;
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  // The auth store is persisted; wait for it so a signed-in visitor isn't sent to sign in.
  useEffect(() => setHydrated(true), []);

  async function download() {
    setState("busy");
    setError(null);
    try {
      const res = await privacyService.downloadExport(id, token);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(res.headers["content-disposition"]) ?? "your-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
    } catch (err) {
      setError(await blobErrorMessage(err));
      setState("error");
    }
  }

  return (
    <main id="main" className="cx pg auth">
      <div className="daylora-container auth-grid">
        <section className="card auth-card" aria-labelledby="dxH">
          <div className="auth-form">
            <h1 id="dxH" className="auth-h1">
              Download your data
            </h1>
            {!token ? (
              <p className="lede">This link is incomplete. Use the link in the email we sent, or request a new copy from Privacy &amp; data.</p>
            ) : !hydrated ? null : !signedIn ? (
              <>
                <p className="lede">For your security, sign in to the account that requested this download.</p>
                <Link href={`/login?next=${encodeURIComponent(here)}`} className="btn btn-primary btn-block">
                  Sign in to download
                </Link>
              </>
            ) : (
              <>
                <p className="lede">
                  Your file has your account details, addresses, orders, reviews, saved items and store credit activity, in JSON.
                </p>
                {error && (
                  <div className="alert err" role="alert">
                    {error}
                  </div>
                )}
                {state === "done" && (
                  <div className="alert ok" role="status">
                    Download started. Check your downloads folder.
                  </div>
                )}
                <button type="button" className="btn btn-primary btn-block" onClick={download} disabled={state === "busy"}>
                  {state === "busy" ? "Preparing…" : "Download my data"}
                </button>
              </>
            )}
            <Link href="/account#privacy" className="link sm back">
              Back to Privacy &amp; data
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function fileName(disposition: string | undefined): string | null {
  const m = disposition && /filename="?([^";]+)"?/i.exec(disposition);
  return m ? m[1] : null;
}

/** Errors arrive as a Blob because the request asks for one. */
async function blobErrorMessage(err: unknown): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: string };
      if (body.message) return body.message;
    } catch {
      // not JSON: fall through
    }
  }
  return getApiErrorMessage(err, "We couldn't download your data. The link may have expired; request a new copy.");
}
