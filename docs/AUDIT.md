# SEO, inquiry flow and QA audit

Date: 2026-10-19. Scope: technical SEO, structured data, AEO and GEO; the project inquiry flow; QA, accessibility, performance and security across the whole site. Every check listed as passed below was run on this branch.

## 1. Issues found

| Area | Issue | Status |
| --- | --- | --- |
| Accessibility | Footer disclaimer text failed WCAG AA contrast (`text-navy-100/50` on navy), on every page (axe, serious). | Fixed |
| Structured data | `FAQPage` markup on the homepage, services and guides. Google restricts FAQ rich results to government and health sites, so it only targeted rich results. | Removed; the questions stay as plain HTML |
| Structured data | `ProfessionalService` (a LocalBusiness type) used with no confirmed address; no `WebPage` entities; entities not linked by `@id`; guide reviewer modelled on `Article` instead of the page. | Fixed |
| Metadata | No Open Graph or Twitter image anywhere. | Fixed: generated share images (site default, one per service, one per guide) |
| Metadata | Homepage description 184 characters. | Shortened to 158 |
| Indexing | Empty `/projects/` placeholder page was indexable and in the sitemap. | Now `noindex` and left out of the sitemap until a case study is approved |
| Redirects | No redirects for the old permitguys.ca WordPress URLs. | Added for the known URLs (see §5 for the rest) |
| Performance | The display font loaded its optical-size axis: a 132 KB preloaded font. | Removed the axis (59 KB). Lighthouse mobile LCP on a service page went from about 2.9 to 3.0 s to about 2.1 to 2.4 s, two runs each |
| Inquiry form | Municipality optional; no preferred contact method; no error summary; failed deliveries lost the consent tick; no spam protection beyond a honeypot; no rate limit, duplicate guard, attribution or analytics hooks; webhook only. | Rebuilt (see §2) |
| Security | No security headers. | Added `nosniff`, `Referrer-Policy`, `X-Frame-Options` and `frame-ancestors`, `Permissions-Policy`, HSTS, `base-uri`, `form-action` and `object-src` restrictions |

## 2. What was implemented

**Technical SEO.** Unique titles, descriptions and canonicals from one helper; Open Graph and Twitter cards with images; indexing controlled by `NEXT_PUBLIC_SITE_URL` (`noindex` and a blocking `robots.txt` until it is set); `max-snippet:-1` and `max-image-preview:large` once indexable; Google and Bing verification meta tags from environment variables; sitemap of indexable canonical URLs only; 404 pages `noindex`; trailing-slash URLs with 308 redirects; permanent redirects from old URLs in `src/content/redirects.ts`; `docs/SEARCH_CONSOLE.md` launch steps.

**Structured data.** One connected graph: `Organization` (switches to `ProfessionalService` only once an address is confirmed), `WebSite`, `WebPage` or `AboutPage`, `ContactPage` and `CollectionPage`, `BreadcrumbList` matching the visible breadcrumbs, `Service` on each service page, `Article` on guides (author and publisher the organization, sources as citations). A `Person` appears only as the reviewer of a guide, and only once a real reviewer is recorded. No ratings, reviews, hours, address or phone are marked up, because none are confirmed.

**AEO.** Every service and guide still opens with a direct answer. Service and guide section headings are now questions (enforced by content validation for guides). Guides gained a "Key terms" definition list, and the costs and timelines guide has a captioned table of the City of Toronto review time frames with its source. Sources and review status remain visible.

**GEO and entity consistency.** The business name, description and region come from `src/content/site.ts` everywhere. The organization's `knowsAbout` lists the services shown on the site. `/llms.txt` lists services and guides with their direct answers.

**Internal linking.** Service pages link to related guides, related services and approved case studies. Location pages link to the services available there. Each service page's call to action opens the form with the matching project type preselected. Guides end with an inquiry call to action.

**Inquiry flow** (details in `docs/INQUIRY.md`):
- Fields: name, email, phone (required only if phone is the preferred method), preferred contact method, project type, municipality or location, optional project stage, description, consent.
- Accessible, mobile-first form: labels, hints, inline errors, an error summary that receives focus and links to each field, focus moved to the success message or failure notice, 48px touch targets, `aria-busy` and a live status while sending, works without JavaScript.
- Server action with server-side validation, honeypot, minimum fill time, per-IP rate limit, duplicate guard and optional Cloudflare Turnstile.
- Delivery adapters behind one interface: Resend email (reply-to set to the visitor, idempotency key) and a signed JSON webhook for a CRM. A lead counts as sent only when a destination confirms it. With nothing configured, the visitor is told the inquiry was not sent.
- Logs never contain personal details.
- Attribution: UTM tags, click ids, referring host, landing page and the service page the visitor came from.
- Analytics events `inquiry_form_start`, `inquiry_form_submit`, `inquiry_form_success`, `click_to_call` and `click_to_email`, sent only if a tag manager is installed (none is).

## 3. Checks that passed

| Check | Result |
| --- | --- |
| `npm run lint` (ESLint, Next.js core web vitals rules) | Pass |
| `npm run typecheck` (strict TypeScript) | Pass |
| `npm test` (Vitest) | 57 tests pass: content validation, copy guardrails, form validation, inquiry handler (every outcome, spam screens, duplicates, rate limit, Turnstile, no personal data in logs), Resend and webhook adapters, attribution, structured data, metadata, redirects |
| `npm run build` | Pass; 28 static pages and share images |
| `npm run check:site` on a non-indexable build | 20 pages, 51 JSON-LD blocks, no problems |
| `npm run check:site -- --indexable` on a build with `NEXT_PUBLIC_SITE_URL=https://permitguys.ca` | Pass. `/projects/` intentionally `noindex` |
| `npm run test:e2e` (Playwright, Chromium, desktop 1440px, tablet 820px, mobile Pixel 7) | 69 pass, 6 skipped by design (viewport-specific tests) |

The crawler checks: HTTP status of every linked page, broken internal links, trailing slashes, one H1 and no skipped heading levels, title and description present, length and uniqueness, absolute self-canonical matching `og:url`, Open Graph and Twitter tags, robots directives for the build mode, JSON-LD syntax and `@context`/`@type`, no `FAQPage`, breadcrumbs ending at the page, image `alt`, `rel="noopener"` on new-tab links, `href="#"`, sitemap against crawled pages, `robots.txt`, `llms.txt`, 404s for unknown slugs, slash redirects and old-site redirects.

The browser tests check: every sitemap page loads with one H1, no console errors and no sideways scrolling at all three widths; axe (WCAG 2.0, 2.1 and 2.2 A and AA, plus best practices) finds no serious or critical issues on ten pages and on the form's error state; skip link; reduced motion; desktop menus and the mobile menu with keyboard and Escape; service call to action preselects the project type; 44px touch targets on mobile; the form's error summary, phone rule, successful delivery with attribution (through a local mock CRM), failure state that keeps the visitor's details, disabled button while sending, and the no-JavaScript path.

Lighthouse 12.8 (mobile, simulated throttling, service page, two runs after the font change): Performance 97 and 99, LCP 2.4 s and 2.1 s, TBT 70 ms, CLS 0. An earlier full run scored Accessibility 100 and Best Practices 100. SEO scored 66 only because that build was deliberately `noindex`.

## 4. Checks that could not be run

- **The old site.** permitguys.ca is blocked from the build environment, so its pages could not be crawled. Redirects cover the URLs found through search results only.
- **Real email delivery.** No Resend API key or verified sending domain is configured here, and the Resend account could not be queried from this environment. The Resend adapter is covered by unit tests against Resend's documented API; a real test send is needed after configuration.
- **Other browsers.** Firefox and Safari (WebKit) are not installed in the environment; tests ran in Chromium only.
- **Screen readers.** Semantics were checked with axe and keyboard tests, not with NVDA or VoiceOver.
- **Field Core Web Vitals.** Lighthouse is a lab test. Real-user data appears in Search Console after launch.
- **Google Rich Results Test and validator.schema.org.** Both need a public URL; JSON-LD syntax and structure were checked locally.

## 5. Remaining launch blockers

1. **Business facts.** Phone, email, address (and whether it is shown publicly), hours, legal name, logo and social profiles are still placeholders. The old site and the Google Business Profile disagree on the address (Brampton or Oakville), and the profile's category is "Architecture firm". These need Sebra's confirmation before they go in `src/content/site.ts`.
2. **Credentials and scope.** Whose BCIN supports the old site's "BCIN-certified drawings" claim, and whether PermitGuys submits applications as the owner's agent and provides engineering.
3. **Service areas.** No municipality is confirmed yet, so no location pages exist.
4. **Inquiry delivery.** Set the Resend variables (with a verified sending domain) or a CRM webhook, then send a real test inquiry.
5. **Redirects.** Export the old site's indexed URLs from Search Console (especially blog posts) and add any missing ones to `src/content/redirects.ts`.
6. **Privacy policy.** Still a draft with placeholders; it needs the contact for privacy questions, retention period, the list of service providers (Resend, hosting, Turnstile if used, any analytics) and the business's approval.
7. **Guide review.** Each guide needs a qualified reviewer, a review date and verified source links.
8. **Indexing.** Set `NEXT_PUBLIC_SITE_URL` on production and follow `docs/SEARCH_CONSOLE.md`.

Worth considering from the old site once Sebra confirms PermitGuys still offers them: Committee of Adjustment and minor variance applications, below-grade entrances, load-bearing wall removal, door and window openings, multi-family dwellings, and laneway and garden suites.

## 6. Environment variables and integrations

See `.env.example` and `docs/INQUIRY.md`. In short: `NEXT_PUBLIC_SITE_URL` (required for indexing, needed at build time), `SITE_NOINDEX` (staging), `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`, `RESEND_API_KEY` with `INQUIRY_EMAIL_FROM` and `INQUIRY_EMAIL_TO`, `INQUIRY_WEBHOOK_URL` with optional `INQUIRY_WEBHOOK_SECRET`, optional `NEXT_PUBLIC_TURNSTILE_SITE_KEY` with `TURNSTILE_SECRET_KEY`, and optional rate-limit tuning.

External integrations: Resend (verified domain with SPF and DKIM), a CRM or automation webhook if wanted, Google Search Console, Bing Webmaster Tools, optionally Cloudflare Turnstile, and optionally a tag manager with a consent setup.

## Known limitations

- The rate limit and duplicate guard are in memory per server instance (best-effort on serverless hosting). `docs/INQUIRY.md` explains how to back them with Redis.
- No script Content-Security-Policy: Next.js inline scripts would need per-request nonces, which would make every page dynamic.
- Share-image URLs omit the trailing slash, so crawlers follow one 308 redirect to fetch them.
- `/contact-us` without a slash redirects twice (adding the slash, then to `/contact/`).
- `npm audit` reports vulnerabilities in development-only tooling (`vitest` 4.0, and `braces` through `eslint-config-next`). None ship to the browser or server. Upgrading `vitest` to 4.1.12 is worth doing; npm 10 in this environment failed to resolve that upgrade.
