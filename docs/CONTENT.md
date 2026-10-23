# Editing content

All content lives in `src/content`. Change the data, not the templates. `npm run build` validates everything and fails with a list of problems if something is missing or broken.

## Rules

- Do not add testimonials, awards, credentials, statistics, prices, approval timelines or project results unless the business supplies and approves them.
- Describe requirements as typical and defer to the municipality.
- Every factual claim in a guide should be traceable to a listed source. Set a source's `checked` date only after a person has opened it and confirmed it.

## Positioning and titles

- PermitGuys is presented as an architecture and engineering firm: it designs projects, works out their engineering and prepares the drawings for the building permit (the client's direction, October 2026). Lead with design and engineering; the permit is what the work achieves.
- "Architect" and "engineer" are protected titles in Ontario (the Ontario Association of Architects and Professional Engineers Ontario). The business confirmed on 23 October 2026 that the site may call the firm architects. It has not confirmed who holds an engineering licence, so the site describes engineering as work the firm does but never calls anyone an engineer, professional engineer or P.Eng. Change that only when the business confirms it.
- Credentials are the ones in `site.credentials`, as the business worded them.

## Business facts: `site.ts`

Replace `null` values with real details. Placeholders disappear automatically and structured data picks the values up.

## Adding a confirmed service area: `locations.ts`

```ts
{
  slug: "toronto",
  name: "Toronto",
  region: "City of Toronto",
  coverage: "confirmed", // only after the business confirms it serves Toronto
  summary: "One or two sentences on working with Toronto Building.",
  localPermitInfo: [
    { heading: "Who issues permits", paragraphs: ["Verified local information..."] },
  ],
  officialLinks: [{ label: "Toronto Building", url: "https://www.toronto.ca/..." }],
  relatedServices: ["residential-additions"],
  relatedGuides: ["do-i-need-a-building-permit"],
  seo: { title: "Permit Drawings in Toronto", description: "..." },
}
```

Add a municipality only when there is enough verified, local information to make the page genuinely useful.

## Adding a case study: `projects.ts`

```ts
{
  slug: "rear-addition-example",
  title: "Rear addition to a semi-detached house",
  approved: true, // only with the client's permission
  services: ["residential-additions"],
  location: null, // or a confirmed location slug
  summary: "...",
  brief: ["What the client needed."],
  scope: ["What PermitGuys prepared."],
  outcome: ["What happened, as stated by the business."],
  visual: { drawing: "addition", alt: "...", photo: { /* see IMAGES.md */ } },
  seo: { title: "...", description: "..." },
}
```

## Guide review

When a qualified person reviews a guide, set `lastReviewed: "YYYY-MM-DD"` and `reviewer: { name, credentials }`. The review placeholder is replaced and the date is added to structured data.
