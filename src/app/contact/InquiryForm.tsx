"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { track } from "@/lib/analytics";
import { ATTRIBUTION_STORAGE_KEY, sanitizeAttribution } from "@/lib/inquiry/attribution";
import { HONEYPOT_FIELD } from "@/lib/inquiry/protection";
import type { InquiryState } from "@/lib/inquiry/state";
import { paths } from "@/lib/routes";
import {
  formToRecord,
  inquiryFields,
  limits,
  projectStages,
  projectTypeForService,
  projectTypes,
  validateInquiry,
  type InquiryErrors,
  type InquiryField,
} from "@/lib/validation/inquiry";
import { submitInquiry } from "./actions";

const ERROR = "text-[#a3361f]";
const field =
  "mt-2 block w-full rounded-none border-0 border-b border-ink/25 bg-transparent px-0 py-3.5 text-lg text-ink transition-colors duration-500 placeholder:text-ink-muted/70 hover:border-ink/50 focus:border-ink focus:ring-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500";
const invalid = "border-[#a3361f]";

const labels: Record<InquiryField, string> = {
  name: "Your name",
  email: "Email",
  phone: "Phone",
  preferredContact: "Preferred contact method",
  projectType: "Project type",
  municipality: "Municipality or project location",
  stage: "Where are you in the project?",
  details: "Tell us about your project",
  consent: "Consent to contact",
};

/** The element an error-summary link moves focus to. */
const focusTarget = (f: InquiryField) => (f === "preferredContact" ? "preferredContact-email" : f);

const describedBy = (id: string, error?: string, hint?: boolean) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

function Field({
  id,
  error,
  hint,
  optional,
  children,
}: {
  id: InquiryField;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-label text-ink-muted">
        {labels[id]}
        {optional ? <span className="font-normal text-ink-muted"> (optional)</span> : null}
      </label>
      {children}
      {/* Under the control, so the controls of a paired row line up whatever their hints say. */}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={id} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className={cn("mt-2 text-sm", ERROR)}>
      <span className="sr-only">Error: </span>
      {error}
    </p>
  ) : null;
}

function ErrorSummary({ errors, summaryRef }: { errors: InquiryErrors; summaryRef: React.RefObject<HTMLDivElement | null> }) {
  const list = inquiryFields.filter((f) => errors[f]);
  if (list.length === 0) return null;
  return (
    <div ref={summaryRef} tabIndex={-1} aria-labelledby="error-summary-title" className="rounded-r-xl border-l-2 border-[#a3361f] bg-[#a3361f]/5 p-5 focus:outline-2 focus:outline-offset-2 focus:outline-[#a3361f]">
      <h2 id="error-summary-title" className="font-semibold text-[#7d2914]">
        There {list.length === 1 ? "is a problem" : `are ${list.length} problems`} with your inquiry
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {list.map((f) => (
          <li key={f}>
            <a
              href={`#${focusTarget(f)}`}
              className="text-[#7d2914] underline underline-offset-4"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(focusTarget(f))?.focus();
              }}
            >
              {errors[f]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Notice = { tone: "warning" | "error"; title: string; body: ReactNode };

function noticeFor(status: InquiryState["status"], directContact: ReactNode): Notice | null {
  switch (status) {
    case "not_configured":
      return {
        tone: "warning",
        title: "Your inquiry was not sent.",
        body: <>Online inquiries are not connected yet, so nothing was sent. Your details are still in the form. {directContact}</>,
      };
    case "failed":
      return {
        tone: "error",
        title: "Your inquiry was not sent.",
        body: <>Something went wrong on our side and we could not confirm delivery. Your details are still in the form, so please try again in a moment. {directContact}</>,
      };
    case "rate_limited":
      return {
        tone: "error",
        title: "Too many attempts.",
        body: <>We received several inquiries from your connection in a short time. Please wait a few minutes and try again. {directContact}</>,
      };
    case "blocked":
      return {
        tone: "error",
        title: "We could not send your inquiry.",
        body: <>Our spam protection stopped this submission. Please wait a moment and try again. {directContact}</>,
      };
    default:
      return null;
  }
}

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function InquiryForm({ directContact }: { directContact: ReactNode }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const [clientErrors, setClientErrors] = useState<InquiryErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const meta = useRef<{ id: string; startedAt: string; attribution: string } | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  // Client-only values live in hidden inputs written after hydration, and
  // again after every server response because React resets the form then.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    if (!meta.current) {
      const params = new URLSearchParams(window.location.search);
      let attribution = {};
      try {
        attribution = sanitizeAttribution(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "");
      } catch {
        attribution = {};
      }
      const service = params.get("service");
      meta.current = {
        id: crypto.randomUUID(),
        startedAt: String(Date.now()),
        attribution: JSON.stringify(sanitizeAttribution({ ...attribution, cta_service: service ?? undefined })),
      };
      const preset = projectTypeForService(service);
      const select = form.elements.namedItem("projectType") as HTMLSelectElement | null;
      if (preset && select && !select.value) select.value = preset;
    }
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (el) el.value = value;
    };
    set("submissionId", meta.current.id);
    set("startedAt", meta.current.startedAt);
    set("attribution", meta.current.attribution);
    if (state.status !== "idle" && state.status !== "sent") window.turnstile?.reset();
  }, [state]);

  // Move focus to whatever the visitor needs to read next.
  useEffect(() => {
    if (state.status === "sent") {
      successRef.current?.focus();
      track("inquiry_form_success");
    } else if (state.status === "invalid") summaryRef.current?.focus();
    else if (state.status !== "idle") noticeRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (focusRequest) summaryRef.current?.focus();
  }, [focusRequest]);

  if (state.status === "sent") {
    return (
      <div className="border-l border-ink/25 py-2 pl-8">
        <h2 ref={successRef} tabIndex={-1} className="font-display text-display-md font-light text-ink focus:outline-none">
          Thank you. Your inquiry has been sent.
        </h2>
        <p className="mt-4 text-ink-muted">
          We have received your project details and will reply using your preferred contact method. Your reference is{" "}
          <strong className="font-semibold text-charcoal-900">{state.reference}</strong>.
        </p>
        <p className="mt-4 text-ink-muted">
          While you wait, our{" "}
          <Link href={paths.guides} className="text-charcoal-900 underline underline-offset-4">
            permit guides
          </Link>{" "}
          explain what most projects involve.
        </p>
      </div>
    );
  }

  const errors: InquiryErrors = clientErrors ?? (state.status === "invalid" ? state.errors : {});
  const values = state.status === "idle" ? {} : state.values;
  const notice = noticeFor(state.status, directContact);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (pending) {
      e.preventDefault();
      return;
    }
    const result = validateInquiry(formToRecord(new FormData(e.currentTarget)));
    if (!result.ok) {
      e.preventDefault();
      setClientErrors(result.errors);
      setFocusRequest((n) => n + 1);
      return;
    }
    setClientErrors(null);
    track("inquiry_form_submit", { project_type: result.value.projectType, preferred_contact: result.value.preferredContact });
  };

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    track("inquiry_form_start");
  };

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={onSubmit}
      onFocus={onFirstInteraction}
      noValidate
      aria-busy={pending}
      aria-labelledby="inquiry-form-title"
      className="space-y-7"
    >
      <h2 id="inquiry-form-title" className="sr-only">
        Project inquiry form
      </h2>

      <ErrorSummary errors={errors} summaryRef={summaryRef} />

      {notice ? (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role="alert"
          className={cn(
            "p-5 text-sm leading-relaxed focus:outline-2 focus:outline-offset-2",
            notice.tone === "warning"
              ? "border border-dashed border-brand-500 bg-brand-500/[0.07] text-brand-700 focus:outline-brand-600"
              : "border-l-2 border-[#a3361f] bg-[#a3361f]/5 text-[#7d2914] focus:outline-[#a3361f]",
          )}
        >
          <p className="font-semibold">{notice.title}</p>
          <p className="mt-1">{notice.body}</p>
        </div>
      ) : null}

      <p className="text-sm text-ink-muted">All fields are required unless marked optional.</p>

      {/* Spam honeypot: hidden from people and assistive technology. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name="submissionId" defaultValue="" />
      <input type="hidden" name="startedAt" defaultValue="" />
      <input type="hidden" name="attribution" defaultValue="" />

      {/* Paired fields: two columns where the form has the width (not in the narrower column beside the sidebar at lg). */}
      <div className="grid items-start gap-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field id="name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={limits.name}
            defaultValue={values.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name", errors.name)}
            className={cn(field, errors.name && invalid)}
          />
        </Field>
        <Field id="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            required
            maxLength={limits.email}
            defaultValue={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", errors.email)}
            className={cn(field, errors.email && invalid)}
          />
        </Field>
        <Field id="phone" optional hint="Needed only if you prefer a call." error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={limits.phone}
            defaultValue={values.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", errors.phone, true)}
            className={cn(field, errors.phone && invalid)}
          />
        </Field>
        <fieldset aria-describedby={errors.preferredContact ? "preferredContact-error" : undefined}>
          <legend className="text-label text-ink-muted">{labels.preferredContact}</legend>
          <div className="mt-2 flex gap-3">
            {(
              [
                ["email", "Email"],
                ["phone", "Phone"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                htmlFor={`preferredContact-${value}`}
                className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-full px-5 text-base text-ink ring-1 ring-ink/20 transition-colors duration-500 ring-inset has-[:checked]:bg-ink has-[:checked]:text-ivory has-[:checked]:ring-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500"
              >
                <input
                  id={`preferredContact-${value}`}
                  type="radio"
                  name="preferredContact"
                  value={value}
                  defaultChecked={(values.preferredContact ?? "email") === value}
                  className="size-4 accent-brand-500 focus:outline-none"
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError id="preferredContact" error={errors.preferredContact} />
        </fieldset>
        <Field id="projectType" error={errors.projectType}>
          <select
            id="projectType"
            name="projectType"
            required
            defaultValue={values.projectType ?? ""}
            aria-invalid={Boolean(errors.projectType)}
            aria-describedby={describedBy("projectType", errors.projectType)}
            className={cn(field, errors.projectType && invalid)}
          >
            <option value="" disabled>
              Choose one
            </option>
            {projectTypes.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="municipality" hint="For example, Toronto, Mississauga or Vaughan." error={errors.municipality}>
          <input
            id="municipality"
            name="municipality"
            type="text"
            autoComplete="address-level2"
            required
            maxLength={limits.municipality}
            defaultValue={values.municipality}
            aria-invalid={Boolean(errors.municipality)}
            aria-describedby={describedBy("municipality", errors.municipality, true)}
            className={cn(field, errors.municipality && invalid)}
          />
        </Field>
        <Field id="stage" optional error={errors.stage}>
          <select
            id="stage"
            name="stage"
            defaultValue={values.stage ?? ""}
            aria-invalid={Boolean(errors.stage)}
            aria-describedby={describedBy("stage", errors.stage)}
            className={cn(field, errors.stage && invalid)}
          >
            <option value="">Choose one</option>
            {projectStages.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="details" hint="What you want to build or change, and anything you already know about the property. Please leave out sensitive personal information." error={errors.details}>
        <textarea
          id="details"
          name="details"
          rows={6}
          required
          maxLength={limits.detailsMax}
          defaultValue={values.details}
          aria-invalid={Boolean(errors.details)}
          aria-describedby={describedBy("details", errors.details, true)}
          className={cn(field, "resize-y", errors.details && invalid)}
        />
      </Field>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            defaultChecked={values.consent === "on"}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent", errors.consent)}
            className="mt-1 size-5 shrink-0 accent-charcoal-900"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-ink-muted">
            PermitGuys may use these details to contact me about this inquiry, as described in the{" "}
            <Link href={paths.privacy} className="text-charcoal-900 underline underline-offset-4">
              privacy policy
            </Link>
            .
          </label>
        </div>
        <FieldError id="consent" error={errors.consent} />
      </div>

      {turnstileSiteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        </>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex min-h-13 items-center justify-center gap-4 rounded-full bg-ink py-1.5 pr-1.5 pl-8 text-[0.9375rem] font-medium text-ivory transition-colors duration-500 hover:bg-charcoal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send inquiry"}
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-brand-500 text-white">
            {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" /> : <span className="size-1.5 rounded-full bg-white transition-transform duration-500 group-hover:scale-[2]" />}
          </span>
        </button>
        <p role="status" aria-live="polite" className="text-sm text-ink-muted">
          {pending ? "Sending your inquiry. Please keep this page open." : ""}
        </p>
      </div>
    </form>
  );
}
