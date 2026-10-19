# PermitGuys website: implementation plan

## 1. Existing stack and project state

- No repository existed. This is a fresh project scaffolded with `create-next-app@16.4.2`.
- Stack, as specified for a fresh repository: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4, ESLint (`eslint-config-next`).
- Next.js 16 enables Cache Components by default. It is switched off here because the site is fully static and some collections (projects, service areas) start empty, which Cache Components rejects in `generateStaticParams`. Revisit if request-time data is added.
- `trailingSlash: true` so every URL matches the required `/route/` form; `typedRoutes: true` for compile-time route checks.

## 2. Architecture

```
src/
  app/                    Routes (Server Components by default)
  components/
    layout/               Header, client navigation, footer, skip link
    home/                 Homepage sections, in page order
    templates/            Service, guide, location and case-study templates
    ui/                   Design-system primitives
  content/                Typed content: services, guides, locations, projects, FAQs, sources, site facts
  lib/
    content.ts            The only read path for content; validates and filters
    validation/           Content validation and inquiry-form validation
    seo.ts, jsonld.ts     Metadata and structured data builders
    routes.ts             Every internal path in one place
tests/                    Vitest unit tests
scripts/check-site.mjs    Crawler: status codes, links, headings, metadata, 404s
```

- Content is separate from presentation. Templates receive typed objects; no copy lives in templates except structural labels.
- Client Components are limited to the navigation (`MainNav`) and the inquiry form.
- Routes for services, guides, locations and projects are generated from content with `generateStaticParams` and `dynamicParams = false`, so unknown slugs return 404.

## 3. Routes and templates

| Route | Source | Template |
| --- | --- | --- |
| `/` | homepage sections | `app/page.tsx` |
| `/services/`, `/services/[slug]/` (7) | `content/services.ts` | `ServiceTemplate` |
| `/permit-guides/`, `/permit-guides/[slug]/` (4) | `content/guides.ts` | `GuideTemplate` |
| `/service-areas/`, `/service-areas/[slug]/` | `content/locations.ts` (confirmed only; none yet) | `LocationTemplate` |
| `/projects/`, `/projects/[slug]/` | `content/projects.ts` (approved only; none yet) | `CaseStudyTemplate` |
| `/about/`, `/how-it-works/`, `/contact/`, `/privacy-policy/` | page files | page-specific |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | generated from content | |

## 4. Design system

- Tokens in `src/app/globals.css` (`@theme`): the permitguys.ca palette of red (`brand`), charcoal, white and pale grey (`paper`); see docs/DESIGN.md.
- Type: Lufga for headings and Gilroy for body (with Outfit and Plus Jakarta Sans as stand-ins until the licensed files are added; see docs/DESIGN.md), loaded with `next/font` (self-hosted at build, no layout shift). Fluid display sizes via `text-display-*`.
- Layout: `Container` (78rem max), `Section` (tones: paper, light, dark), hairline rules instead of cards, 2px corner radius.
- Components: `ButtonLink`, `ArrowLink`, `Eyebrow`, `SectionHeading`, `PageHeader`, `DirectAnswer`, `Breadcrumbs`, `FaqList` (native `<details>`), `StepList` (with step owner), `LinkRows`, `Figure`, `Drawing`, `SourceList`, `Placeholder`, `CtaPanel`, `ArticleLayout`.
- Imagery: drafted SVG line drawings in a permit-drawing style stand in for photography (stock sites were unreachable from the build environment). `Figure` switches to `next/image` when a `photo` is added, with a fixed aspect ratio so nothing shifts.
- Motion: one restrained entrance on the hero and hover transitions, all disabled under `prefers-reduced-motion`.

## 5. Content and data models (`src/content/types.ts`)

- `Service`: direct answer, overview, who it is for, typical requirements with a qualifier, process steps with an owner, cost and timeline factors (no figures), FAQs, related guides and services, visual, SEO.
- `Guide`: question title, direct answer, sections, sources (with a `checked` date), `lastReviewed`, `reviewer` (null until verified), FAQs, related links.
- `Location`: `coverage: "confirmed" | "unconfirmed"`; only confirmed locations render. Requires local permit information and official links.
- `CaseStudy`: `approved` flag; only approved entries render. Outcome text only as stated by the business.
- `site.ts`: every unknown business fact is `null` and renders as a visible `PLACEHOLDER`.
- `lib/validation/content.ts` fails the build on empty fields, broken cross-references, duplicate slugs, bad URLs or dates, over-long SEO fields, guide titles that are not questions, and case studies linked to unconfirmed locations.

## 6. SEO, AEO and GEO

- `pageMetadata()` gives every page a title, description, canonical, Open Graph and Twitter data in one format.
- Structured data, linked by `@id`: `Organization` (becomes `ProfessionalService` once an address is confirmed) and `WebSite` site-wide, `WebPage` (or `AboutPage`, `ContactPage`, `CollectionPage`) plus `BreadcrumbList` on inner pages, `Service` on services, `Article` (author and publisher the organization, with citations) on guides. No `FAQPage`: Google limits FAQ rich results to government and health sites, and the answers are already plain HTML.
- Answer-first pages: each service and guide opens with a short, quotable direct answer; FAQs are in plain HTML.
- Sources and review status are visible on every guide; reviewer attribution only when verified.
- `/llms.txt` lists services and guides with their direct answers for AI assistants.
- Sitemap lists only canonical, indexable URLs (static pages, services, guides, confirmed locations, approved projects).
- Indexing is off until `NEXT_PUBLIC_SITE_URL` is set: pages carry `noindex` and `robots.txt` disallows crawling, so a preview deployment cannot be indexed by accident.

## 7. Testing and QA

- `npm run lint`, `npm run typecheck`, `npm test` (Vitest: content validation, copy guardrails against prices and guarantees, inquiry validation, route helpers), `npm run build`.
- `npm run check:site` against a running build: crawls every internal link and checks for 200s, one `<h1>`, title, description, canonical, no `href="#"`, trailing slashes, unique titles and descriptions, working sitemap, robots and llms.txt, and 404s for unknown slugs.
- Manual checks done: desktop (1440px) and mobile (390px) screenshots of key pages, no horizontal overflow, keyboard behaviour of the desktop menus and mobile panel (Escape closes and returns focus), form validation and the not-connected state.

## 8. Next steps

See the launch checklist in the README.
