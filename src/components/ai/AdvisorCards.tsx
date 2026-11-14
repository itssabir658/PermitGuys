"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";
import { getVisitorSnapshot } from "@/context/VisitorTelemetryContext";
import { track } from "@/lib/analytics";
import { HANDOFF_STORAGE_KEY, type Handoff } from "@/lib/chat/handoff";
import { ATTRIBUTION_STORAGE_KEY } from "@/lib/inquiry/attribution";
import { PROJECT_TYPES, TO_BE_CONFIRMED, type ProjectTypeKey } from "@/lib/ai/project-types";
import { site } from "@/content/site";
import type { LeadRequest, LeadResult } from "@/lib/ai/submit-lead";
import type { ComplianceCheck, DealCloser, ProjectScope, Stage } from "@/lib/ai/tools";
import { paths } from "@/lib/routes";
import { SourceLink } from "./AdvisorReply";
import { advisorSessionId, markAdvisorClosed } from "./session-summary";

/*
 * The cards the permit strategist puts in the conversation: the project
 * scope (a drawing sheet), the permit check, and the closing card that sends
 * the visitor's request to the team. Everything on them comes from the tool
 * results, which are built from the site's own content.
 */

export interface ScopeInput {
  projectType: ProjectTypeKey;
  municipality: string;
  estimatedSqFt: number | null;
  structuralChanges: boolean;
  stage: Stage | "";
  summary: string;
}

export type Transcript = { role: "visitor" | "assistant"; text: string }[];

const SENT_KEY = "pg_advisor_sent";

const readSent = (): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(SENT_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

/* ---------- Project scope ---------- */

export function ScopeCard({
  scope,
  input,
  id,
  getTranscript,
  onNavigate,
}: {
  scope: ProjectScope;
  input: ScopeInput;
  id: string;
  getTranscript: () => Transcript;
  onNavigate: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const closerRef = useRef<HTMLDivElement>(null);
  const disciplines = scope.drawings.map((d) => d.discipline);

  useEffect(() => {
    if (closing) closerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [closing]);

  return (
    <div className="mt-4">
      <article className="advisor-sheet relative overflow-hidden bg-charcoal-900 text-ivory" aria-label={`Project scope: ${scope.projectLabel}`}>
        <span aria-hidden="true" className="advisor-sheet__grid" />
        <header className="relative flex items-start justify-between gap-3 border-b border-ivory/15 px-4 pt-3.5 pb-3">
          <div>
            <p className="text-label text-charcoal-300">Project scope</p>
            <h3 className="mt-1.5 font-display text-[1.2rem] leading-tight text-ivory">{scope.projectLabel}</h3>
            <p className="mt-1 text-xs text-charcoal-300">
              {scope.municipality || "Municipality to confirm"}
              {scope.serviceArea === "to-confirm" && scope.municipality ? " · we confirm we can take it" : ""}
            </p>
          </div>
          <p aria-hidden="true" className="shrink-0 border border-ivory/20 px-2 py-1 text-right font-mono text-[0.625rem] leading-tight text-charcoal-300">
            SHEET
            <br />
            <span className="text-ivory">A-001</span>
          </p>
        </header>

        <div className="relative px-4 py-3.5">
          {scope.summary ? <p className="text-[0.8125rem] leading-relaxed text-ivory/80">{scope.summary}</p> : null}

          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Disciplines in the drawing set">
            {disciplines.map((d) => (
              <li key={d} className="border border-ivory/25 px-2 py-0.5 font-mono text-[0.6875rem] tracking-wide text-ivory/90 uppercase">
                {d}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[0.8125rem] text-charcoal-300">{scope.drawingIntro}</p>
          <div className="mt-2 space-y-3">
            {scope.drawings.map((group) => (
              <div key={group.discipline}>
                <p className="text-label text-brand-300">{group.discipline}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="advisor-tick relative pl-5 text-[0.8125rem] leading-snug text-ivory">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-px bg-ivory/15 sm:grid-cols-2">
            <div className="bg-charcoal-900 py-2.5 pr-3">
              <dt className="text-label text-charcoal-300">Drawing turnaround</dt>
              <dd className="mt-1 text-[0.8125rem] text-ivory">{scope.draftingTurnaround}</dd>
            </div>
            <div className="bg-charcoal-900 py-2.5 sm:pl-3">
              <dt className="text-label text-charcoal-300">City review</dt>
              <dd className="mt-1 text-[0.8125rem] text-ivory">{scope.cityReview.window ?? "Set by your municipality"}</dd>
              <dd className="mt-1 text-xs leading-snug text-charcoal-300">{scope.cityReview.note}</dd>
            </div>
            <div className="bg-charcoal-900 py-2.5 pr-3 sm:col-span-2">
              <dt className="text-label text-charcoal-300">Recommended next step</dt>
              <dd className="mt-1 text-[0.8125rem] text-ivory">{scope.recommendedPackage}</dd>
            </div>
          </dl>

          {scope.considerations.length ? (
            <ul className="mt-3 space-y-1.5 border-l-2 border-brand-500 pl-3">
              {scope.considerations.map((c) => (
                <li key={c} className="text-[0.8125rem] leading-snug text-ivory/80">
                  {c}
                </li>
              ))}
            </ul>
          ) : null}

          {scope.municipalityReference ? (
            <div className="mt-4">
              <p className="text-label text-charcoal-300">What {scope.municipalityReference.name} publishes</p>
              {scope.municipalityReference.facts.slice(0, 1).map((f) => (
                <p key={f} className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-ivory/80">
                  {f}
                </p>
              ))}
              <ul className="mt-1.5 space-y-1">
                {scope.municipalityReference.sources.map((s) => (
                  <li key={s.url} className="text-xs">
                    <SourceLink href={s.url} className="text-ivory underline decoration-brand-400 underline-offset-4 hover:decoration-ivory">
                      {s.label}
                    </SourceLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-4 text-[0.6875rem] leading-relaxed text-charcoal-300">{scope.qualifier}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              aria-expanded={closing}
              onClick={() => {
                setClosing(true);
                track("advisor_scope_cta", { project_type: scope.projectType });
              }}
              className="group inline-flex min-h-11 items-center gap-2 bg-brand-500 px-4 py-2.5 text-left text-sm text-white transition-colors duration-300 hover:bg-brand-600"
            >
              Lock in this scope and get your quote
              <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <Link href={scope.servicePage as never} onClick={onNavigate} className="text-sm text-ivory/80 underline underline-offset-4 hover:text-ivory">
              More on this service
            </Link>
          </div>
        </div>
      </article>

      {closing ? (
        <div ref={closerRef}>
          <DealCloserCard
            id={`${id}-close`}
            closer={{
              projectType: scope.projectType,
              projectLabel: scope.projectLabel,
              municipality: scope.municipality,
              stage: scope.stage,
              scopeSummary: scope.summary,
              recommendedAction: "Scope review and quote",
              pricing: TO_BE_CONFIRMED,
              responseTime: null,
              hours: null,
              phone: null,
            }}
            scopeInput={input}
            getTranscript={getTranscript}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Permit check ---------- */

export function ComplianceCard({ check, onScope, onNavigate }: { check: ComplianceCheck; onScope: () => void; onNavigate: () => void }) {
  const block = (title: string, items: readonly string[]) =>
    items.length ? (
      <div className="mt-3">
        <p className="text-label text-ink-muted">{title}</p>
        <ul className="mt-1.5 space-y-1.5">
          {items.map((i) => (
            <li key={i} className="advisor-tick advisor-tick--ink relative pl-5 text-[0.8125rem] leading-snug text-ink">
              {i}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <article className="mt-4 border border-ink/80 bg-ivory" aria-label={`Permit check: ${check.scenarioLabel}`}>
      <header className="flex items-baseline justify-between gap-3 border-b border-line bg-stone-50 px-4 py-3">
        <div>
          <p className="text-label text-ink-muted">Permit check</p>
          <h3 className="mt-1 font-display text-[1.1rem] leading-tight text-ink">{check.scenarioLabel}</h3>
        </div>
        {check.municipality ? <p className="shrink-0 text-xs text-ink-muted">{check.municipality}</p> : null}
      </header>
      <div className="px-4 pt-1 pb-4">
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink">{check.whatTheSiteSays}</p>
        {block("Building Code points the drawings address", check.codeTriggers)}
        {block("Zoning and Committee of Adjustment", check.zoning)}
        {block("Other approvals", check.otherApprovals)}
        {check.municipalityReference ? (
          <div className="mt-3">
            <p className="text-label text-ink-muted">What {check.municipalityReference.name} publishes</p>
            {check.municipalityReference.facts.map((f) => (
              <p key={f} className="mt-1.5 line-clamp-5 text-xs leading-relaxed text-ink">
                {f}
              </p>
            ))}
            <ul className="mt-1.5 space-y-1">
              {check.municipalityReference.sources.map((s) => (
                <li key={s.url} className="text-xs">
                  <SourceLink href={s.url}>{s.label}</SourceLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {block("How we handle it", check.howPermitGuysHelps)}
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-muted">{check.note}</p>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={onScope}
            className="group inline-flex min-h-11 items-center gap-2 bg-charcoal-900 px-4 py-2.5 text-sm text-ivory transition-colors duration-300 hover:bg-charcoal-800"
          >
            Scope this project
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          <Link href={check.servicePage as never} onClick={onNavigate} className="text-sm text-ink underline underline-offset-4">
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Closing card ---------- */

type CloserState = { status: "idle" | "sending" } | { status: "sent"; reference: string } | { status: "error"; message: string; fields?: Partial<Record<string, string>> };

const failureText: Record<string, string> = {
  not_configured: "Requests can't be sent from the website yet.",
  failed: "We couldn't send your request just now.",
  rate_limited: "Too many requests from this connection. Please wait a few minutes.",
  blocked: "We couldn't send your request.",
  invalid: "Please check the highlighted fields.",
};

const fieldClass =
  "mt-1 block min-h-11 w-full border-0 border-b border-ink/30 bg-transparent px-0 py-2 text-base text-ink placeholder:text-ink-muted/60 focus:border-ink focus:ring-0 focus:outline-none aria-invalid:border-brand-600";

export function DealCloserCard({
  id,
  closer,
  scopeInput,
  getTranscript,
  onNavigate,
}: {
  id: string;
  closer: DealCloser;
  scopeInput: ScopeInput | null;
  getTranscript: () => Transcript;
  onNavigate: () => void;
}) {
  const uid = useId();
  const [state, setState] = useState<CloserState>({ status: "idle" });
  const [municipality, setMunicipality] = useState(closer.municipality);
  const [action, setAction] = useState(closer.recommendedAction);
  const meta = useRef<{ submissionId: string; startedAt: string } | null>(null);

  useEffect(() => {
    meta.current ??= { submissionId: crypto.randomUUID(), startedAt: String(Date.now()) };
    const reference = readSent()[id];
    // Restored after hydration: a request sent earlier in this tab stays sent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reference) setState({ status: "sent", reference });
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.status === "sending") return;
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");
    const body: LeadRequest = {
      submissionId: meta.current?.submissionId,
      sessionId: advisorSessionId(),
      startedAt: meta.current?.startedAt,
      website: get("website"),
      contact: { name: get("name"), email: get("email"), phone: get("phone"), propertyAddress: get("address"), bestTimeToCall: get("bestTime") },
      consent: form.get("consent") === "on",
      project: { projectType: closer.projectType, municipality, stage: closer.stage, scopeSummary: closer.scopeSummary, recommendedAction: action },
      scopeInput,
      transcript: getTranscript(),
      snapshot: getVisitorSnapshot(),
      attribution: (() => {
        try {
          return JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "{}") as unknown;
        } catch {
          return {};
        }
      })(),
    };
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/lead/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = (await res.json()) as LeadResult;
      if (result.status === "sent") {
        try {
          sessionStorage.setItem(SENT_KEY, JSON.stringify({ ...readSent(), [id]: result.reference }));
        } catch {
          // The confirmation still shows; it just won't survive a reload.
        }
        markAdvisorClosed();
        track("advisor_lead_sent", { project_type: closer.projectType, action });
        setState({ status: "sent", reference: result.reference });
        return;
      }
      setState({ status: "error", message: failureText[result.status] ?? failureText.failed, fields: result.status === "invalid" ? result.errors : undefined });
    } catch {
      setState({ status: "error", message: failureText.failed });
    }
  };

  const toForm = () => {
    const handoff: Handoff = {
      projectType: PROJECT_TYPES[closer.projectType].formType as Handoff["projectType"],
      municipality,
      stage: (["Just exploring", "Planning and budgeting", "Ready for drawings", "Already applied and have review comments"] as const).find((s) => s === closer.stage) ?? "",
      details: closer.scopeSummary,
    };
    try {
      sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(handoff));
    } catch {
      // The form can still be filled in by hand.
    }
    onNavigate();
  };

  if (state.status === "sent") {
    return (
      <div role="status" className="mt-4 border border-ink/80 bg-ivory px-4 py-4">
        <p className="flex items-center gap-2 text-label text-ink-muted">
          <span aria-hidden="true" className="chat-live" />
          Request received
        </p>
        <p className="mt-2 font-display text-[1.15rem] leading-tight text-ink">Thank you. Your project is with our team.</p>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink">
          We&rsquo;ll be in touch {closer.responseTime ? closer.responseTime : "during business hours"} with next steps for your {closer.projectLabel.toLowerCase()}. Your reference is{" "}
          <strong className="font-mono font-normal tracking-wide">{state.reference}</strong>.
        </p>
      </div>
    );
  }

  const err = state.status === "error" ? state.fields ?? {} : {};
  const fieldError = (name: string) =>
    err[name] ? (
      <p id={`${uid}-${name}-err`} className="mt-1 text-xs text-brand-700">
        {err[name]}
      </p>
    ) : null;

  return (
    <article className="advisor-closer mt-4 border border-ink/80 bg-ivory" aria-label="Lock in your project">
      <header className="relative bg-charcoal-900 px-4 pt-3.5 pb-3 text-ivory">
        <p className="text-label text-charcoal-300">Lock it in</p>
        <h3 className="mt-1.5 font-display text-[1.15rem] leading-tight">Get your scope reviewed and quoted</h3>
        <p className="mt-1 text-xs text-charcoal-300">Your project is filled in. Add how we reach you.</p>
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-line bg-stone-50 px-4 py-3 text-[0.8125rem]">
        <dt className="text-ink-muted">Project</dt>
        <dd className="text-ink">{closer.projectLabel}</dd>
        {closer.stage ? (
          <>
            <dt className="text-ink-muted">Stage</dt>
            <dd className="text-ink">{closer.stage}</dd>
          </>
        ) : null}
        {closer.scopeSummary ? (
          <>
            <dt className="text-ink-muted">Scope</dt>
            <dd className="line-clamp-4 text-ink">{closer.scopeSummary}</dd>
          </>
        ) : null}
        <dt className="text-ink-muted">Price and timeline</dt>
        <dd className="text-ink">{closer.pricing}</dd>
      </dl>
      <form onSubmit={onSubmit} className="px-4 pt-2 pb-4" noValidate>
        <fieldset className="mt-2">
          <legend className="text-label text-ink-muted">I&rsquo;d like</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {(["Scope review and quote", "Priority call back"] as const).map((a) => (
              <label
                key={a}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center border px-2 py-2 text-center text-[0.8125rem] transition-colors duration-200",
                  action === a ? "border-ink bg-charcoal-900 text-ivory" : "border-line-strong text-ink hover:border-ink",
                )}
              >
                <input type="radio" name="action" value={a} checked={action === a} onChange={() => setAction(a)} className="sr-only" />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-3 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-name`} className="mt-2 block text-xs text-ink-muted">
              Name
            </label>
            <input id={`${uid}-name`} name="name" autoComplete="name" required maxLength={120} className={fieldClass} aria-invalid={err.name ? true : undefined} aria-describedby={err.name ? `${uid}-name-err` : undefined} />
            {fieldError("name")}
          </div>
          <div>
            <label htmlFor={`${uid}-phone`} className="mt-2 block text-xs text-ink-muted">
              Phone
            </label>
            <input id={`${uid}-phone`} name="phone" type="tel" autoComplete="tel" required maxLength={30} className={fieldClass} aria-invalid={err.phone ? true : undefined} aria-describedby={err.phone ? `${uid}-phone-err` : undefined} />
            {fieldError("phone")}
          </div>
          <div>
            <label htmlFor={`${uid}-email`} className="mt-2 block text-xs text-ink-muted">
              Email
            </label>
            <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} aria-invalid={err.email ? true : undefined} aria-describedby={err.email ? `${uid}-email-err` : undefined} />
            {fieldError("email")}
          </div>
          <div>
            <label htmlFor={`${uid}-municipality`} className="mt-2 block text-xs text-ink-muted">
              Town or city
            </label>
            <input
              id={`${uid}-municipality`}
              name="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              autoComplete="address-level2"
              required
              maxLength={120}
              className={fieldClass}
              aria-invalid={err.municipality ? true : undefined}
              aria-describedby={err.municipality ? `${uid}-municipality-err` : undefined}
            />
            {fieldError("municipality")}
          </div>
          <div>
            <label htmlFor={`${uid}-address`} className="mt-2 block text-xs text-ink-muted">
              Property address <span className="text-ink-muted/70">(optional)</span>
            </label>
            <input id={`${uid}-address`} name="address" autoComplete="street-address" maxLength={200} className={fieldClass} />
          </div>
          {action === "Priority call back" ? (
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-time`} className="mt-2 block text-xs text-ink-muted">
                Best time to call {closer.hours ? <span className="text-ink-muted/70">({closer.hours.replace(/\.$/, "")})</span> : null}
              </label>
              <select id={`${uid}-time`} name="bestTime" className={fieldClass} defaultValue="Any time">
                <option>Any time</option>
                <option>Morning</option>
                <option>Afternoon</option>
              </select>
            </div>
          ) : null}
        </div>
        {/* People never see this field; forms that fill it in are dropped. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${uid}-website`}>Leave this empty</label>
          <input id={`${uid}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-ink">
          <input name="consent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-brand-500" aria-invalid={err.consent ? true : undefined} />
          <span>
            PermitGuys may contact me about this request. My project details, this conversation and my visit to the site are sent with it (
            <Link href={paths.privacy} onClick={onNavigate} className="underline underline-offset-2">
              privacy
            </Link>
            ).
          </span>
        </label>
        {fieldError("consent")}
        {fieldError("details")}
        {fieldError("projectType")}
        {state.status === "error" ? (
          <p role="alert" className="mt-3 border-l-2 border-brand-500 bg-brand-500/5 px-3 py-2 text-xs text-brand-800">
            {state.message}
            {site.contact.phone ? (
              <>
                {" "}
                You can also call us at{" "}
                <a href={`tel:${site.contact.phone.replace(/\D/g, "")}`} className="underline underline-offset-2">
                  {site.contact.phone}
                </a>{" "}
                or{" "}
                <Link href={paths.contact} onClick={toForm} className="underline underline-offset-2">
                  use the inquiry form
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="group mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-brand-500 px-4 py-3 text-[0.9375rem] text-white transition-colors duration-300 hover:bg-brand-600 disabled:opacity-60"
        >
          {state.status === "sending" ? "Sending…" : action === "Priority call back" ? "Request my call back" : "Lock in my scope and quote"}
          {state.status === "sending" ? null : <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
        </button>
        <p className="mt-2.5 text-center text-xs text-ink-muted">
          Prefer the full form?{" "}
          <Link href={`${paths.contact}?from=chat` as never} onClick={toForm} className="underline underline-offset-2">
            Open it with your project filled in
          </Link>
          .
        </p>
      </form>
    </article>
  );
}
