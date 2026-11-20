import { ontarioPermitFacts } from "@/content/gta-permits";
import { servedWithoutPage } from "@/content/locations";
import { serviceQuickFacts } from "@/content/quick-facts";
import { site } from "@/content/site";
import type { Faq, QuickFact } from "@/content/types";
import { OWNER_DEFAULTS, whatsappDisplay } from "@/lib/ai/owner-contact";
import { getGuides, getLocations, getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

/*
 * /llms.txt and /llms-full.txt (the llmstxt.org convention): Markdown for AI
 * assistants and answer engines, generated from the same content files as
 * the pages, so they never say more than the site does.
 */

const url = (p: string) => absoluteUrl(p, site.url);
const disclaimer =
  "Each municipality sets its own permit requirements and decides whether a permit is issued. PermitGuys never guarantees approvals or timelines, and it does not publish prices.";

function aboutBlock(): string[] {
  const { contact } = site;
  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Architects, Engineers, Designers & Project Managers. PermitGuys designs residential and commercial projects, prepares the architectural and engineering drawings for the building permit and submits the permit application for the owner, as the owner's agent.",
    "",
    disclaimer,
    "",
    "## Credentials",
    ...site.credentials.map((c) => `- ${c}`),
    "",
    "## Contact",
    `- Office: ${contact.address}`,
    `- Hours: ${contact.hours}`,
    `- Phone: ${contact.phone}`,
    `- Email: ${contact.email}`,
    `- Owner (email): ${OWNER_DEFAULTS.email}`,
    `- WhatsApp: ${whatsappDisplay(OWNER_DEFAULTS.whatsapp)}`,
    `- Inquiry form: ${url(paths.contact)}`,
    "",
  ];
}

const served = () => {
  const all = [...getLocations().map((l) => l.name), ...servedWithoutPage];
  return all.length > 1 ? `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}` : all.join("");
};

/** The short index at /llms.txt. */
export function llmsIndex(): string {
  const lines = [
    ...aboutBlock(),
    "## Services",
    ...getServices().map((s) => `- [${s.name}](${url(paths.service(s.slug))}): ${s.directAnswer}`),
    "",
    "## Municipalities we serve",
    `PermitGuys works in ${served()}, Ontario.`,
    "",
    ...getLocations().map((l) => `- [Building permits in ${l.name}, ON](${url(paths.serviceArea(l.slug))}): ${l.summary}`),
    ...servedWithoutPage.map((name) => `- ${name}: served; no local page yet.`),
    "",
    "## Permit guides",
    ...getGuides().map((g) => `- [${g.title}](${url(paths.guide(g.slug))}): ${g.directAnswer}`),
    "",
    "## Company",
    `- [About PermitGuys](${url(paths.about)})`,
    `- [How it works](${url(paths.howItWorks)})`,
    `- [Projects](${url(paths.projects)})`,
    `- [Contact](${url(paths.contact)})`,
    "",
    "## Optional",
    `- [Full text of services, guides and municipality pages](${url("/llms-full.txt")})`,
    "",
  ];
  return lines.join("\n");
}

const faqLines = (faqs: Faq[]) => faqs.flatMap((f) => [`### ${f.question}`, "", ...f.answer.flatMap((p) => [p, ""])]);
const factLines = (facts: QuickFact[]) => facts.map((f) => `- **${f.term}:** ${f.detail}${f.source ? ` (Source: [${f.source.label}](${f.source.url}))` : ""}`);

/** The full text at /llms-full.txt. */
export function llmsFull(): string {
  const lines = [...aboutBlock()];

  lines.push("# Services", "");
  for (const s of getServices()) {
    lines.push(
      `## ${s.name}`,
      "",
      `URL: ${url(paths.service(s.slug))}`,
      "",
      s.directAnswer,
      "",
      ...s.overview.flatMap((p) => [p, ""]),
      "### Quick permit overview",
      "",
      ...factLines(serviceQuickFacts(s)),
      "",
      "### Who it is for",
      "",
      ...s.whoItsFor.map((i) => `- ${i}`),
      "",
      `### What a permit application usually needs`,
      "",
      s.typicalRequirements.intro,
      "",
      ...s.typicalRequirements.items.map((i) => `- ${i}`),
      "",
      s.typicalRequirements.qualifier,
      "",
      ...faqLines(s.faqs),
    );
  }

  lines.push("# Municipalities we serve", "", `PermitGuys works in ${served()}, Ontario.`, "");
  for (const l of getLocations()) {
    lines.push(`## Building permits in ${l.name}, ON`, "", `URL: ${url(paths.serviceArea(l.slug))}`, "", l.summary, "");
    if (l.quickFacts?.length) lines.push("### Quick permit overview", "", ...factLines(l.quickFacts), "");
    for (const block of l.localPermitInfo) {
      lines.push(`### ${block.heading}`, "", ...block.paragraphs.map((p) => `- ${p}`), "");
    }
    if (l.checkedOn) lines.push(`Summarised from the municipality's own pages, read on ${l.checkedOn}. Not complete lists; the building department decides.`, "");
    lines.push("Official sources:", ...l.officialLinks.map((o) => `- [${o.label}](${o.url})`), "");
    lines.push(...faqLines(l.faqs ?? []));
  }

  lines.push("# Ontario background", "", ...ontarioPermitFacts.facts.map((f) => `- ${f}`), "", "Sources:", ...ontarioPermitFacts.sources.map((s) => `- [${s.label}](${s.url})`), "");

  lines.push("# Permit guides", "");
  for (const g of getGuides()) {
    lines.push(`## ${g.title}`, "", `URL: ${url(paths.guide(g.slug))}`, "", g.directAnswer, "");
    for (const sec of g.sections) {
      lines.push(`### ${sec.heading}`, "", ...sec.paragraphs.flatMap((p) => [p, ""]));
      if (sec.list) lines.push(...sec.list.map((i) => `- ${i}`), "");
      if (sec.table) {
        lines.push(`${sec.table.caption}:`, "", `| ${sec.table.columns.join(" | ")} |`, `| ${sec.table.columns.map(() => "---").join(" | ")} |`, ...sec.table.rows.map((r) => `| ${r.join(" | ")} |`), "", `Source: ${sec.table.source}`, "");
      }
    }
    lines.push(...faqLines(g.faqs), "Sources:", ...g.sources.map((s) => `- [${s.title}](${s.url}) (${s.publisher})`), "");
  }

  return lines.join("\n");
}

export const markdownResponse = (body: string) =>
  new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" } });
