# Editing content

All content lives in `src/content`. Change the data, not the templates. `npm run build` validates everything and fails with a list of problems if something is missing or broken.

## Rules

- Do not add testimonials, awards, credentials, statistics, prices, approval timelines or project results unless the business supplies and approves them.
- Describe requirements as typical and defer to the municipality.
- Every factual claim in a guide should be traceable to a listed source. Set a source's `checked` date only after a person has opened it and confirmed it.

## Positioning and titles

- PermitGuys is presented as an architecture and engineering firm: it designs projects, works out their engineering and prepares the drawings for the building permit (the client's direction, October 2026). Lead with design and engineering; the permit is what the work achieves.
- "Architect" and "engineer" are protected titles in Ontario (the Ontario Association of Architects and Professional Engineers Ontario). The business confirmed on 23 October 2026 that the site may call the firm architects. On 19 November 2026 it confirmed that its engineers are licensed P.Eng. and that it submits permit applications as the owner's agent; individual engineers are not named until the business supplies names.
- Credentials are the ones in `site.credentials`, as the business worded them.

## Business facts: `site.ts`

Replace `null` values with real details. Placeholders disappear automatically and structured data picks the values up.

## Service areas: `locations.ts`

Service-area pages are generated, not written by hand. A municipality gets a page when it is in the municipalities list the business confirmed it serves (`recognition.ts` `municipalities`) and has verified local information in `gta-permits.ts` (the municipality's own pages, summarised close to their wording, with the date they were read). A served municipality without that information (Hamilton today) is named on the service-area hub without a page, so there are no thin, near-duplicate pages. To add one, add its official facts and sources to `gta-permits.ts`.

Each page has an answer-first summary, a "Quick permit overview" definition list, the municipality's published facts, questions (also its FAQPage structured data), official links, and Service structured data for that city. No fees or review times are quoted except Toronto's published review time frames.

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
