# PermitGuys website

Marketing website for PermitGuys, a building permit consulting and permit drawing service for homeowners and property owners in the Greater Toronto Area.

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + unit tests
npm run build
npm start & npm run check:site   # crawl the running build for broken links and metadata
```

Requires Node 20.9 or newer.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin, e.g. `https://www.example.ca`. Until set, every page is `noindex` and `robots.txt` blocks crawlers. |
| `SITE_NOINDEX` | Set to `true` on staging to keep it out of search even with a site URL. |
| `INQUIRY_WEBHOOK_URL` | Endpoint that receives contact-form submissions as JSON. Until set, the form validates but tells visitors it is not connected. |

## Where things are

- `docs/IMPLEMENTATION_PLAN.md`: architecture, routes, design system, SEO/AEO/GEO and QA
- `docs/CONTENT.md`: how to edit services, guides, service areas and case studies
- `docs/IMAGES.md`: how to add licensed photography
- `src/content/`: all copy and data

## Launch checklist

Search the code for `PLACEHOLDER` or the rendered pages for `data-placeholder` to find every gap.

- [ ] Business facts in `src/content/site.ts`: phone, email, address (if published), hours, legal name
- [ ] Logo to replace the wordmark placeholder (`Wordmark` in `SiteHeader.tsx`)
- [ ] Verified credentials (e.g. BCIN), team and company story for `/about/`
- [ ] Confirm the scope of service: whether PermitGuys submits applications as the owner's agent, which consultants it coordinates, and whether it offers engineering
- [ ] Confirmed municipalities, with local permit information, in `locations.ts`
- [ ] Approved case studies in `projects.ts`
- [ ] Licensed photography (`docs/IMAGES.md`)
- [ ] A qualified reviewer checks each guide and the sources (`checked`, `lastReviewed`, `reviewer`)
- [ ] Privacy policy reviewed and completed
- [ ] `INQUIRY_WEBHOOK_URL` connected and tested
- [ ] `NEXT_PUBLIC_SITE_URL` set on production
