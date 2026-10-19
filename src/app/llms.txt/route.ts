import { site } from "@/content/site";
import { getGuides, getLocations, getServices } from "@/lib/content";
import { absoluteUrl, paths } from "@/lib/routes";

export const dynamic = "force-static";

/**
 * /llms.txt: a plain-text map of the site for AI assistants and answer
 * engines (llmstxt.org convention), generated from the same content files.
 */
export function GET() {
  const url = (p: string) => absoluteUrl(p, site.url);
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Permit requirements are set by each municipality, which decides whether a permit is issued. PermitGuys does not guarantee approvals or timelines.",
    "",
    "## Services",
    ...getServices().map((s) => `- [${s.name}](${url(paths.service(s.slug))}): ${s.directAnswer}`),
    "",
    "## Permit guides",
    ...getGuides().map((g) => `- [${g.title}](${url(paths.guide(g.slug))}): ${g.directAnswer}`),
    "",
    "## Service areas",
    ...(getLocations().length
      ? getLocations().map((l) => `- [${l.name}](${url(paths.serviceArea(l.slug))})`)
      : [`- [Greater Toronto Area](${url(paths.serviceAreas)})`]),
    "",
    "## Company",
    `- [About](${url(paths.about)})`,
    `- [How it works](${url(paths.howItWorks)})`,
    `- [Contact](${url(paths.contact)})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
