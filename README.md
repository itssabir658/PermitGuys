# PermitGuys website

Marketing website for PermitGuys, an architecture and engineering firm in Oakville that designs projects for homeowners, landlords and businesses across the Greater Toronto Area and prepares their drawings for the building permit.

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

Copy `.env.example` to `.env.local` for local work and set the same variables in the hosting provider for production. Secrets are only read on the server; only `NEXT_PUBLIC_*` values reach the browser.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin, e.g. `https://permitguys.ca`. Until set, every page is `noindex` and `robots.txt` blocks crawlers. Needed at build time. |
| `SITE_NOINDEX` | Set to `true` on staging to keep it out of search even with a site URL. |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Search engine ownership meta tags (docs/SEARCH_CONSOLE.md). |
| `RESEND_API_KEY`, `INQUIRY_EMAIL_FROM`, `INQUIRY_EMAIL_TO` | Email each inquiry to the business through Resend. |
| `INQUIRY_WEBHOOK_URL`, `INQUIRY_WEBHOOK_SECRET` | Send each inquiry as signed JSON to a CRM or automation tool. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile spam check. |
| `INQUIRY_RATE_LIMIT_MAX`, `INQUIRY_RATE_LIMIT_WINDOW_MINUTES`, `INQUIRY_MIN_FILL_SECONDS` | Optional spam-protection tuning. |

Without a configured destination the form validates but tells visitors their inquiry was not sent. Details in docs/INQUIRY.md.

## Tests

```bash
npm run check                    # lint, typecheck, 57 unit tests
npm run build && npm run test:e2e   # Playwright: every route, forms, axe accessibility, desktop/tablet/mobile
npm start & npm run check:site      # crawler: links, metadata, canonicals, JSON-LD, sitemap, redirects, 404s
```

## Where things are

- `docs/IMPLEMENTATION_PLAN.md`: architecture, routes, design system, SEO/AEO/GEO and QA
- `docs/CONTENT.md`: how to edit services, guides, service areas and case studies
- `docs/IMAGES.md`: how to add licensed photography
- `docs/INQUIRY.md`: the inquiry form, delivery adapters, spam protection and analytics events
- `docs/SEARCH_CONSOLE.md`: turning on indexing, Search Console and Bing setup at launch
- `docs/AUDIT.md`: the SEO, inquiry and QA audit report
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
- [ ] Inquiry delivery configured (Resend and/or a CRM webhook) and a real test inquiry received
- [ ] Old permitguys.ca URLs exported from Search Console and mapped in `src/content/redirects.ts`
- [ ] Search Console and Bing set up (docs/SEARCH_CONSOLE.md)
- [ ] `NEXT_PUBLIC_SITE_URL` set on production
