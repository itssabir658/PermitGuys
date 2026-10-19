/**
 * Validation for the project inquiry form. Shared by the server action and
 * unit tests; the browser also applies the matching HTML constraints.
 */

export const projectTypes = [
  "Residential addition",
  "Commercial permit",
  "Landlord or rental property",
  "Interior renovation",
  "Legal basement apartment",
  "Deck",
  "Custom home",
  "Something else",
] as const;

export const projectStages = [
  "Just exploring",
  "Planning and budgeting",
  "Ready for drawings",
  "Already applied and have review comments",
] as const;

export interface Inquiry {
  name: string;
  email: string;
  phone: string;
  municipality: string;
  projectType: (typeof projectTypes)[number];
  stage: (typeof projectStages)[number];
  details: string;
  consent: boolean;
}

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;

export type InquiryResult =
  | { ok: true; value: Inquiry }
  | { ok: false; errors: InquiryErrors; values: Record<string, string> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\-.\s]{7,20}$/;

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function parseInquiry(form: FormData): InquiryResult {
  const values = {
    name: str(form, "name"),
    email: str(form, "email"),
    phone: str(form, "phone"),
    municipality: str(form, "municipality"),
    projectType: str(form, "projectType"),
    stage: str(form, "stage"),
    details: str(form, "details"),
  };
  const consent = form.get("consent") === "on";
  const errors: InquiryErrors = {};

  if (values.name.length < 2) errors.name = "Please enter your name.";
  if (values.name.length > 120) errors.name = "Please shorten your name.";
  if (!EMAIL.test(values.email)) errors.email = "Please enter a valid email address.";
  if (values.phone && !PHONE.test(values.phone)) errors.phone = "Please enter a valid phone number, or leave it blank.";
  if (values.municipality.length > 120) errors.municipality = "Please shorten the municipality name.";
  if (!projectTypes.includes(values.projectType as Inquiry["projectType"])) errors.projectType = "Please choose a project type.";
  if (!projectStages.includes(values.stage as Inquiry["stage"])) errors.stage = "Please choose where you are in the project.";
  if (values.details.length < 20) errors.details = "Please describe your project in a sentence or two.";
  if (values.details.length > 4000) errors.details = "Please keep the description under 4,000 characters.";
  if (!consent) errors.consent = "Please confirm we may contact you about your inquiry.";

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };
  return {
    ok: true,
    value: {
      ...values,
      projectType: values.projectType as Inquiry["projectType"],
      stage: values.stage as Inquiry["stage"],
      consent,
    },
  };
}
