# Search engine setup at launch

Do these once the new site is live on its production domain.

## 1. Turn indexing on

1. Set `NEXT_PUBLIC_SITE_URL` to the production origin with no trailing slash, for example `https://permitguys.ca`. Pick one host (with or without `www`) and make the hosting provider redirect the other one to it.
2. Leave `SITE_NOINDEX` unset on production. Set it to `true` on any staging site.
3. Redeploy. Check that `https://<domain>/robots.txt` says `Allow: /` and lists the sitemap, and that a page's source has `<meta name="robots" content="index, follow">`.

Until step 1 is done, every page is `noindex` and `robots.txt` blocks crawling. This is deliberate so preview deployments never appear in search.

## 2. Google Search Console

1. Go to https://search.google.com/search-console and add a **Domain** property for the domain (covers http, https, www and non-www). This needs a DNS TXT record at the domain registrar.
   If DNS access is not available, add a **URL prefix** property instead and choose the **HTML tag** method. Copy the `content` value of the tag into `GOOGLE_SITE_VERIFICATION` and redeploy.
2. If permitguys.ca already has a Search Console property for the old WordPress site, keep it. Before switching, open **Indexing > Pages** and export the indexed URLs, then make sure each one has an entry in `src/content/redirects.ts` (individual blog posts in particular).
3. Under **Sitemaps**, submit `sitemap.xml`.
4. Use **URL inspection** on the homepage, one service page and one guide, and choose **Request indexing**.
5. After a few days, review **Pages** (indexing problems), **Enhancements > Breadcrumbs** (structured data) and **Core Web Vitals**.

## 3. Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters. The quickest route is **Import from Google Search Console**.
2. Otherwise add the site and choose the meta tag method: put the `content` value into `BING_SITE_VERIFICATION` and redeploy.
3. Submit `sitemap.xml`. Bing's index also feeds several AI assistants, so this step matters for AI search visibility.

## 4. Google Business Profile

Make sure the profile's website link points at the new domain, and that the business name, address and phone number match the site exactly once they are confirmed in `src/content/site.ts`.

## 5. Checks after launch

- Run `npm run check:site -- https://<domain> --indexable` against production.
- Validate a service page and a guide at https://search.google.com/test/rich-results and https://validator.schema.org.
- Check share previews with a link in a messaging app or the LinkedIn Post Inspector.

## Search and AI crawlers (November 2026)

- The live origin is `https://www.permitguys.ca` (the bare domain redirects to it in Vercel). A Vercel production build uses it automatically; `NEXT_PUBLIC_SITE_URL` overrides it. Preview and local builds are noindex and robots.txt disallows them.
- `*.vercel.app` hosts send `X-Robots-Tag: noindex, nofollow` (next.config.ts), so only www.permitguys.ca is indexed.
- robots.txt names Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended, Applebot(-Extended) and DuckDuckBot, and keeps every crawler out of /api/.
- `/llms.txt` (index) and `/llms-full.txt` (full text) are generated from the content files (src/lib/llms.ts).
- Visits from ChatGPT carry `utm_source=chatgpt.com`; the inquiry form's attribution (src/lib/inquiry/attribution.ts) records it with the inquiry, along with the referring host.
