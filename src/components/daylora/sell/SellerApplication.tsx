"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import { useAuth } from "@/hooks/useAuth";
import onboardingService from "@/services/supplier/onboarding.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { MyApplication } from "@/types/api/supplier.types";
import { ApplyAccount } from "./ApplyAccount";
import { ApplicationFormView } from "./ApplicationFormView";
import { ApplicationDocuments } from "./ApplicationDocuments";
import { PROGRESS, docsDone, progressIndex } from "./applicationRules";
import { DocIcon, MailIcon } from "./icons";
import "./sell-apply.css";

/* =====================================================================
   Seller application (design: seller-portal-application). The applicant
   creates an ordinary account (or signs in), fills a five-step application
   saved as a server-side draft, and, once our review passes, uploads their
   documents here. Approval turns the account into a seller account.
   ===================================================================== */

type View = "status" | "form" | "docs";

/** The onboarding progress bar under the header. */
export function ObBar({ index }: { index: number }) {
  return (
    <div className="obbar">
      <ol aria-label="Onboarding progress">
        {PROGRESS.map((b, i) => (
          <li key={b} className={i < index ? "done" : i === index ? "now" : ""} aria-current={i === index ? "step" : undefined}>
            <i>{i < index ? "✓" : i + 1}</i>
            <span>{b}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SellerApplication() {
  const router = useRouter();
  const { isAuthenticated, user, role, logout } = useAuth();
  const [ready, setReady] = useState(false);
  const [app, setApp] = useState<MyApplication | null | undefined>(undefined);
  const [view, setView] = useState<View>("status");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // The persisted session is only known in the browser.
  useEffect(() => setReady(true), []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await onboardingService.get();
      // A first save racing this read (right after sign-up) wins over an empty answer.
      setApp((prev) => r.data.data ?? prev ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't load your application. Please try again."));
    }
  }, []);

  useEffect(() => {
    if (ready && isAuthenticated) load();
  }, [ready, isAuthenticated, load]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>(".sell-apply h1")?.focus({ preventScroll: true });
  }, [view, app?.stage]);

  if (!ready) return <main id="main" className="sell-page sell-apply" />;

  if (!isAuthenticated) {
    return (
      <main id="main" className="sell-page sell-apply">
        <ObBar index={0} />
        <div className="ob">
          <ApplyAccount
            onCreated={async (companyName) => {
              try {
                const r = await onboardingService.save({ step: 0, companyName });
                setApp(r.data.data);
              } catch {
                await load();
              }
              setView("status");
            }}
          />
        </div>
      </main>
    );
  }

  const signOut = async (next?: string) => {
    await logout();
    router.push(next ? `/login?next=${encodeURIComponent(next)}` : "/sell");
  };

  let body: ReactNode;
  if (error) {
    body = (
      <div className="form-card ob-status">
        <div className="alert bad" role="alert">
          <DayloraIcon name="alert" />
          <span>{error}</span>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          Try again
        </button>
      </div>
    );
  } else if (app === undefined) {
    body = <p className="ob-loading">Loading your application…</p>;
  } else if (view === "form" && (!app || app.stage === "DRAFT" || app.stage === "AUTO_REJECTED")) {
    body = (
      <ApplicationFormView
        app={app}
        onChange={setApp}
        onSubmitted={(a) => {
          setApp(a);
          setView("status");
        }}
      />
    );
  } else if (view === "docs" && app && ["DOCUMENTS", "APPROVED", "SUSPENDED"].includes(app.stage)) {
    body = (
      <ApplicationDocuments
        app={app}
        onChange={setApp}
        onLater={() => setView("status")}
        onSubmitted={() => {
          setFlash("Thanks. We’ve got your documents and we’ll check them shortly.");
          setView("status");
        }}
      />
    );
  } else {
    body = (
      <ApplicationStatus
        app={app}
        contact={user?.fullName ?? ""}
        isMerchant={role === "ROLE_MERCHANT"}
        flash={flash}
        onApply={async (reedit) => {
          setFlash(null);
          if (reedit && app) {
            // Changing answers puts an auto-rejected application back into draft.
            try {
              const r = await onboardingService.save({ step: 2 });
              setApp(r.data.data);
            } catch (err) {
              setError(getApiErrorMessage(err, "We couldn't reopen your application."));
              return;
            }
          }
          setView("form");
        }}
        onDocs={() => {
          setFlash(null);
          setView("docs");
        }}
        onSignOut={signOut}
      />
    );
  }

  const index = view === "form" ? 1 : view === "docs" ? 3 : progressIndex(app?.stage ?? null);
  return (
    <main id="main" className="sell-page sell-apply">
      <ObBar index={index} />
      <div className="ob">{body}</div>
    </main>
  );
}

// ── Status (the design's "pending" screen) ──────────────────────────────────

const MINI_STEPS: Array<[string, string]> = [
  ["Account created", "Signed in as you"],
  ["Application", "Company, products, shipping, product data"],
  ["Our review", "Scorecard check by our catalog manager"],
  ["Documents", "W-9, signed agreement, insurance certificate"],
  ["Approved", "Product upload unlocks"],
];

function ApplicationStatus({
  app,
  contact,
  isMerchant,
  flash,
  onApply,
  onDocs,
  onSignOut,
}: {
  app: MyApplication | null;
  contact: string;
  isMerchant: boolean;
  flash: string | null;
  onApply: (reedit: boolean) => void;
  onDocs: () => void;
  onSignOut: (next?: string) => void;
}) {
  const stage = app?.stage ?? null;
  const company = app?.companyName || app?.form.legalName || "your business";
  const started = !!app && (app.step > 0 || Object.keys(app.form).length > 0);
  const done = app ? docsDone(app) : 0;
  const allDocs = !!app && done === app.requiredDocuments.length;
  const sentBack = app?.documents.filter((d) => d.status === "REJECTED" || d.status === "EXPIRED") ?? [];

  let tone = "info";
  let icon: ReactNode = <DocIcon />;
  let title: string;
  let sub: ReactNode;
  let action: ReactNode = null;
  let idx = progressIndex(stage);

  if (!app && isMerchant) {
    tone = "ok";
    icon = <DayloraIcon name="check" />;
    title = "You already have a seller account";
    sub = "Your account can upload products in the Seller Portal.";
    action = (
      <Link className="btn btn-primary block" href="/merchant">
        Go to the Seller Portal
      </Link>
    );
    idx = 5;
  } else if (!app || stage === "DRAFT") {
    title = started ? "Finish your application" : "Next: tell us about your business";
    sub = `Your account is ready. ${started ? "Pick up where you left off." : "It takes about 10 minutes."} You can save and come back any time.`;
    action = (
      <button className="btn btn-primary block" onClick={() => onApply(false)}>
        {started ? "Continue application" : "Start application"}
      </button>
    );
  } else if (stage === "APPLIED" || stage === "SCREENED" || stage === "SCORECARD") {
    tone = "warn";
    icon = <DayloraIcon name="clock" />;
    title = "Your application is in review";
    sub = `Thanks${contact ? `, ${contact.split(/\s+/)[0]}` : ""}. Our catalog manager is reviewing ${company}. We usually reply within a few business days.`;
    action = (
      <div className="alert info">
        <MailIcon />
        <span>We’ll email you when there’s an update. You can’t add products until you’re approved.</span>
      </div>
    );
  } else if (stage === "AUTO_REJECTED") {
    tone = "warn";
    icon = <DayloraIcon name="alert" />;
    title = "We can’t approve this application";
    sub = `Based on your answers, ${company} doesn’t meet our requirements right now.`;
    action = (
      <>
        <div className="alert bad">
          <DayloraIcon name="alert" />
          <ul>
            {app.failedChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <button className="btn btn-secondary block" onClick={() => onApply(true)}>
          Change my answers
        </button>
      </>
    );
  } else if (stage === "DECLINED") {
    tone = "warn";
    icon = <DayloraIcon name="alert" />;
    title = "We can’t approve this application";
    sub = `Thank you for applying. We can’t approve ${company} right now.`;
    action = app.declineReason ? (
      <div className="alert bad">
        <DayloraIcon name="alert" />
        <span>{app.declineReason}</span>
      </div>
    ) : null;
  } else if (stage === "DOCUMENTS" && allDocs && !sentBack.length) {
    icon = <DayloraIcon name="clock" />;
    title = "Documents received";
    sub = "We’re checking your documents. Once your account is approved you can start adding products.";
    idx = 4;
    action = (
      <button className="btn btn-secondary block" onClick={onDocs}>
        View my documents
      </button>
    );
  } else if (stage === "DOCUMENTS") {
    tone = "ok";
    icon = <DayloraIcon name="check" />;
    title = "Application passed. Upload your documents";
    sub = `One last step for ${company}: ${app.requiredDocuments.length} documents, then we activate your account.`;
    action = (
      <>
        {sentBack.length ? (
          <div className="alert bad">
            <DayloraIcon name="alert" />
            <span>
              Please upload again: {sentBack.map((d) => `${d.label}${d.note ? ` (${d.note})` : ""}`).join("; ")}
            </span>
          </div>
        ) : null}
        <button className="btn btn-primary block" onClick={onDocs}>
          Upload documents
        </button>
      </>
    );
  } else if (stage === "APPROVED") {
    tone = "ok";
    icon = <DayloraIcon name="check" />;
    title = "You’re approved";
    sub = `${company} is approved. Product upload is unlocked in the Seller Portal. Every product is still reviewed before customers see it.`;
    // A session from before the approval still carries the customer role: sign in again to pick it up.
    action = isMerchant ? (
      <Link className="btn btn-primary block" href="/merchant">
        Go to the Seller Portal
      </Link>
    ) : (
      <button className="btn btn-primary block" onClick={() => onSignOut("/merchant")}>
        Sign in to the Seller Portal
      </button>
    );
  } else {
    tone = "warn";
    icon = <DayloraIcon name="alert" />;
    title = "Your seller account is suspended";
    sub = "You can’t add or change products while your account is suspended. We emailed you how to get it reinstated.";
    action = app.suspensionReason ? (
      <div className="alert bad">
        <DayloraIcon name="alert" />
        <span>{app.suspensionReason}</span>
      </div>
    ) : null;
  }

  return (
    <div className="form-card ob-status">
      {flash ? (
        <div className="alert ok" role="status">
          <DayloraIcon name="check" />
          <span>{flash}</span>
        </div>
      ) : null}
      <span className={`big-ic ${tone}`}>{icon}</span>
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        <p className="sub">{sub}</p>
        {app ? <p className="ref">Reference {app.reference}</p> : null}
      </div>
      <ol className="steps-mini">
        {MINI_STEPS.map(([t, d], i) => (
          <li key={t} className={i < idx ? "done" : i === idx ? "now" : ""}>
            <span className="d">{i < idx ? "✓" : i + 1}</span>
            <span>
              <b>{t}</b>
              <span>{d}</span>
            </span>
          </li>
        ))}
      </ol>
      {action}
      <button className="btn btn-ghost block" onClick={() => onSignOut()}>
        Sign out
      </button>
    </div>
  );
}
