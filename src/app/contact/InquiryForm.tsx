"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cn } from "@/components/ui/cn";
import { paths } from "@/lib/routes";
import { projectStages, projectTypes } from "@/lib/validation/inquiry";
import { submitInquiry, type InquiryState } from "./actions";

const field =
  "mt-2 block w-full rounded-[2px] border border-line-strong bg-paper px-4 py-3 text-base text-navy-900 placeholder:text-ink-muted/70 focus:border-navy-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-copper-600";

function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-navy-900">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#a3361f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: boolean) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

export function InquiryForm() {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="border-l-2 border-copper-500 bg-paper-100 p-8">
        <h2 className="font-display text-display-sm text-navy-900">Thank you. Your inquiry has been sent.</h2>
        <p className="mt-4 text-ink-muted">We will review your project details and reply by email.</p>
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" || state.status === "unavailable" ? state.values : {};

  return (
    <form action={action} noValidate className="space-y-7" aria-describedby="form-status">
      <div id="form-status" role="status" aria-live="polite">
        {state.status === "invalid" ? (
          <p className="border-l-2 border-[#a3361f] bg-[#a3361f]/5 p-4 text-sm text-[#7d2914]">Please check the highlighted fields.</p>
        ) : null}
        {state.status === "unavailable" ? (
          <p data-placeholder="" className="border border-dashed border-copper-500 bg-copper-500/[0.07] p-4 text-sm text-copper-700">
            Online inquiries are not connected yet, so your message was not sent. Please contact us directly using the details on this page.
          </p>
        ) : null}
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id="name" label="Your name" error={errors.name}>
          <input id="name" name="name" type="text" autoComplete="name" required defaultValue={values.name} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name", errors.name)} className={cn(field, errors.name && "border-[#a3361f]")} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={values.email} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email", errors.email)} className={cn(field, errors.email && "border-[#a3361f]")} />
        </Field>
        <Field id="phone" label="Phone" optional error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={values.phone} aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("phone", errors.phone)} className={cn(field, errors.phone && "border-[#a3361f]")} />
        </Field>
        <Field id="municipality" label="Property municipality" optional hint="For example, Toronto or Mississauga." error={errors.municipality}>
          <input id="municipality" name="municipality" type="text" autoComplete="address-level2" defaultValue={values.municipality} aria-invalid={Boolean(errors.municipality)} aria-describedby={describedBy("municipality", errors.municipality, true)} className={field} />
        </Field>
        <Field id="projectType" label="Project type" error={errors.projectType}>
          <select id="projectType" name="projectType" required defaultValue={values.projectType ?? ""} aria-invalid={Boolean(errors.projectType)} aria-describedby={describedBy("projectType", errors.projectType)} className={cn(field, errors.projectType && "border-[#a3361f]")}>
            <option value="" disabled>
              Choose one
            </option>
            {projectTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id="stage" label="Where are you in the project?" error={errors.stage}>
          <select id="stage" name="stage" required defaultValue={values.stage ?? ""} aria-invalid={Boolean(errors.stage)} aria-describedby={describedBy("stage", errors.stage)} className={cn(field, errors.stage && "border-[#a3361f]")}>
            <option value="" disabled>
              Choose one
            </option>
            {projectStages.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="details" label="Tell us about your project" hint="What you want to build or change, and anything you already know about the property." error={errors.details}>
        <textarea id="details" name="details" rows={6} required defaultValue={values.details} aria-invalid={Boolean(errors.details)} aria-describedby={describedBy("details", errors.details, true)} className={cn(field, "resize-y", errors.details && "border-[#a3361f]")} />
      </Field>

      <div>
        <div className="flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" required aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("consent", errors.consent)} className="mt-1 size-4 accent-navy-900" />
          <label htmlFor="consent" className="text-sm leading-relaxed text-ink-muted">
            PermitGuys may contact me about this inquiry. See our{" "}
            <Link href={paths.privacy} className="text-navy-900 underline underline-offset-4">
              privacy policy
            </Link>
            .
          </label>
        </div>
        {errors.consent ? (
          <p id="consent-error" className="mt-2 text-sm text-[#a3361f]">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center bg-navy-900 px-8 text-[0.95rem] font-medium text-paper transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
