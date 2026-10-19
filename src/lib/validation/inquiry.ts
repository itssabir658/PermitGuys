/**
 * Validation for the project inquiry form. The same rules run in the browser
 * (for instant feedback) and on the server (the only check that counts), so
 * this module must stay free of server-only and browser-only APIs.
 */

/** Project types offered in the form, with the service page each one matches. */
export const projectTypes = [
  { label: "Residential addition", service: "residential-additions" },
  { label: "Commercial permit", service: "commercial-permits" },
  { label: "Landlord or rental property", service: "landlord-permits" },
  { label: "Interior renovation", service: "interior-renovation-permits" },
  { label: "Legal basement apartment", service: "legal-basement-permits" },
  { label: "Deck", service: "deck-permits" },
  { label: "Custom home", service: "custom-home-permits" },
  { label: "Something else", service: null },
] as const;

export type ProjectType = (typeof projectTypes)[number]["label"];

/** The project type to preselect when a visitor arrives from a service page. */
export function projectTypeForService(slug: string | null | undefined): ProjectType | undefined {
  if (!slug) return undefined;
  return projectTypes.find((t) => t.service === slug)?.label;
}

export const projectStages = [
  "Just exploring",
  "Planning and budgeting",
  "Ready for drawings",
  "Already applied and have review comments",
] as const;

export const contactMethods = ["email", "phone"] as const;
export type ContactMethod = (typeof contactMethods)[number];

export interface Inquiry {
  name: string;
  email: string;
  phone: string;
  preferredContact: ContactMethod;
  projectType: ProjectType;
  municipality: string;
  /** Optional. Empty string when the visitor did not choose one. */
  stage: (typeof projectStages)[number] | "";
  details: string;
  consent: true;
}

/** Field names in the order they appear on the form, used for error summaries. */
export const inquiryFields = [
  "name",
  "email",
  "phone",
  "preferredContact",
  "projectType",
  "municipality",
  "stage",
  "details",
  "consent",
] as const satisfies readonly (keyof Inquiry)[];

export type InquiryField = (typeof inquiryFields)[number];
export type InquiryErrors = Partial<Record<InquiryField, string>>;
export type InquiryValues = Partial<Record<InquiryField, string>>;

export type InquiryResult =
  | { ok: true; value: Inquiry }
  | { ok: false; errors: InquiryErrors; values: InquiryValues };

export const limits = {
  name: 120,
  email: 254,
  phone: 30,
  municipality: 120,
  detailsMin: 20,
  detailsMax: 4000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[0-9+()\-.\s]+$/;

/** Collapses whitespace and strips control characters from single-line fields. */
function line(value: string | undefined): string {
  return (value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keeps line breaks in the description but removes other control characters. */
function multiline(value: string | undefined): string {
  return (value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, "")
    .trim();
}

/** Reads the form's text fields into a plain record. Non-string entries are ignored. */
export function formToRecord(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of inquiryFields) {
    const v = form.get(key);
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

export function validateInquiry(input: Record<string, string | undefined>): InquiryResult {
  const values = {
    name: line(input.name),
    email: line(input.email).toLowerCase(),
    phone: line(input.phone),
    preferredContact: line(input.preferredContact) || "email",
    projectType: line(input.projectType),
    municipality: line(input.municipality),
    stage: line(input.stage),
    details: multiline(input.details),
  };
  const consent = input.consent === "on" || input.consent === "true";
  const errors: InquiryErrors = {};

  if (values.name.length < 2) errors.name = "Enter your name.";
  else if (values.name.length > limits.name) errors.name = `Your name must be ${limits.name} characters or fewer.`;

  if (!values.email) errors.email = "Enter your email address.";
  else if (values.email.length > limits.email || !EMAIL.test(values.email))
    errors.email = "Enter an email address in the format name@example.com.";

  const digits = values.phone.replace(/\D/g, "").length;
  if (values.phone && (!PHONE_CHARS.test(values.phone) || digits < 10 || digits > 15 || values.phone.length > limits.phone))
    errors.phone = "Enter a phone number with area code, such as 416 555 0100.";

  if (!contactMethods.includes(values.preferredContact as ContactMethod))
    errors.preferredContact = "Choose how you would like us to contact you.";
  else if (values.preferredContact === "phone" && !values.phone && !errors.phone)
    errors.phone = "Enter a phone number, or choose email as your preferred contact method.";

  if (!projectTypes.some((t) => t.label === values.projectType)) errors.projectType = "Choose the type of project.";

  if (values.municipality.length < 2) errors.municipality = "Enter the municipality or area where the property is.";
  else if (values.municipality.length > limits.municipality)
    errors.municipality = `The location must be ${limits.municipality} characters or fewer.`;

  if (values.stage && !projectStages.includes(values.stage as (typeof projectStages)[number]))
    errors.stage = "Choose where you are in the project, or leave it blank.";

  if (values.details.length < limits.detailsMin)
    errors.details = "Describe your project in a sentence or two (at least 20 characters).";
  else if (values.details.length > limits.detailsMax)
    errors.details = `Keep the description under ${limits.detailsMax.toLocaleString("en-CA")} characters.`;

  if (!consent) errors.consent = "Confirm that PermitGuys may contact you about this inquiry.";

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };
  return {
    ok: true,
    value: {
      ...values,
      preferredContact: values.preferredContact as ContactMethod,
      projectType: values.projectType as ProjectType,
      stage: values.stage as Inquiry["stage"],
      consent: true,
    },
  };
}

export const parseInquiry = (form: FormData) => validateInquiry(formToRecord(form));
