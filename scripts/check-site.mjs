#!/usr/bin/env node
/**
 * Crawls a running build (default http://localhost:3000) from the homepage
 * and checks every internal page for:
 *   - a 200 response, and 404 for a few unknown slugs
 *   - exactly one <h1>, no skipped heading levels
 *   - a <title> (max 70 characters) and a meta description (50 to 170)
 *   - an absolute canonical URL for the page itself, matching og:url
 *   - Open Graph title, description and image
 *   - robots meta: noindex everywhere when the build is not indexable; when it
 *     is, noindex pages are reported and must not be in the sitemap
 *   - valid JSON-LD with @context and @type, and no FAQPage markup
 *   - images with alt attributes, new-tab links with rel="noopener"
 *   - no href="#" links and no internal links to missing pages
 *   - unique titles and descriptions across pages
 *   - sitemap.xml lists only reachable pages and, in an indexable build,
 *     exactly the crawled pages that are not noindex
 *   - robots.txt matches the indexing mode
 *
 * Usage: npm run build && npm start & npm run check:site
 *        npm run check:site -- http://localhost:3100 --indexable
 */
const args = process.argv.slice(2);
const origin = args.find((a) => !a.startsWith("--")) ?? process.env.SITE_ORIGIN ?? "http://localhost:3000";
const expectIndexable = args.includes("--indexable");
const problems = [];
const seen = new Map();
const queue = ["/"];
const titles = new Map();
const descriptions = new Map();
const pages = [];
const noindexPages = [];
let jsonLdBlocks = 0;

const attr = (html, re) => html.match(re)?.[1];
const decode = (s) => s?.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, key) => decode(attr(html, new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`)));

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const res = await fetch(origin + path, { redirect: "manual" });
  seen.set(path, res.status);
  if (res.status !== 200) {
    problems.push(`${path} returned ${res.status}`);
    continue;
  }
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) continue;
  const html = await res.text();
  pages.push(path);

  // Headings
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) problems.push(`${path} has ${h1s} <h1> elements`);
  levels.forEach((level, i) => {
    if (i > 0 && level > levels[i - 1] + 1) problems.push(`${path} skips from <h${levels[i - 1]}> to <h${level}>`);
  });

  // Metadata
  const title = decode(attr(html, /<title>([^<]*)<\/title>/));
  const desc = meta(html, "description");
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title) problems.push(`${path} has no <title>`);
  else if (title.length > 70) problems.push(`${path} title is ${title.length} characters (max 70)`);
  if (!desc) problems.push(`${path} has no meta description`);
  else if (desc.length < 50 || desc.length > 170) problems.push(`${path} description is ${desc.length} characters (50 to 170)`);
  if (!canonical || !/^https?:\/\//.test(canonical) || new URL(canonical).pathname !== path) problems.push(`${path} canonical is ${canonical}`);
  if (canonical && meta(html, "og:url") !== canonical) problems.push(`${path} og:url does not match the canonical`);
  for (const key of ["og:title", "og:description", "og:image", "twitter:card"]) if (!meta(html, key)) problems.push(`${path} has no ${key}`);
  if (title) titles.set(title, [...(titles.get(title) ?? []), path]);
  if (desc) descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);

  const robots = [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((m) => m[1]).join(", ");
  if (/noindex/.test(robots)) noindexPages.push(path);
  if (!expectIndexable && !/noindex/.test(robots)) problems.push(`${path} is indexable in a non-indexable build`);

  // Structured data
  for (const [, raw] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    jsonLdBlocks++;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      problems.push(`${path} has invalid JSON-LD: ${e.message}`);
      continue;
    }
    for (const item of [data].flat()) {
      if (item["@context"] !== "https://schema.org" || !item["@type"]) problems.push(`${path} JSON-LD item lacks @context or @type`);
      if (item["@type"] === "FAQPage") problems.push(`${path} uses FAQPage markup`);
      if (item["@type"] === "BreadcrumbList" && new URL(item.itemListElement.at(-1).item).pathname !== path)
        problems.push(`${path} BreadcrumbList does not end at the page`);
    }
  }

  // Accessibility basics
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(tag)) problems.push(`${path} has an <img> without alt`);
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(tag)) problems.push(`${path} has a new-tab link without rel="noopener"`);
  if (/href="#"/.test(html)) problems.push(`${path} contains href="#"`);

  // Links
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    if (href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href)) continue;
    const clean = decode(href).split("#")[0].split("?")[0];
    if (!clean.startsWith("/")) continue;
    if (!clean.endsWith("/") && !/\.[a-z]+$/.test(clean)) problems.push(`${path} links to ${clean} without a trailing slash`);
    if (!seen.has(clean)) queue.push(clean);
  }
}

// Sitemap and robots.txt
const sitemapRes = await fetch(origin + "/sitemap.xml");
if (sitemapRes.status !== 200) problems.push(`/sitemap.xml returned ${sitemapRes.status}`);
else {
  const xml = await sitemapRes.text();
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const crawled = pages.filter((p) => seen.get(p) === 200);
  for (const p of listed) if (seen.get(p) !== 200) problems.push(`sitemap lists ${p}, which was not reachable by links or did not return 200`);
  for (const p of crawled) {
    const noindex = noindexPages.includes(p);
    if (expectIndexable && noindex && listed.includes(p)) problems.push(`sitemap lists ${p}, which is noindex`);
    if (expectIndexable && !noindex && !listed.includes(p)) problems.push(`${p} is missing from the sitemap`);
  }
  if (new Set(listed).size !== listed.length) problems.push("sitemap has duplicate URLs");
}
const robotsRes = await fetch(origin + "/robots.txt");
const robotsTxt = await robotsRes.text();
if (robotsRes.status !== 200) problems.push(`/robots.txt returned ${robotsRes.status}`);
else if (expectIndexable && (!/Allow: \//.test(robotsTxt) || !/Sitemap: https?:\/\//.test(robotsTxt))) problems.push("robots.txt does not allow crawling or lacks a Sitemap line");
else if (!expectIndexable && !/Disallow: \//.test(robotsTxt)) problems.push("robots.txt allows crawling in a non-indexable build");

const llms = await fetch(origin + "/llms.txt");
if (llms.status !== 200) problems.push(`/llms.txt returned ${llms.status}`);

for (const missing of ["/services/not-a-service/", "/permit-guides/not-a-guide/", "/service-areas/nowhere/", "/projects/not-a-project/", "/no-such-page/"]) {
  const res = await fetch(origin + missing);
  if (res.status !== 404) problems.push(`${missing} returned ${res.status}, expected 404`);
  else if (!/<meta name="robots" content="[^"]*noindex/.test(await res.text())) problems.push(`${missing} 404 page is not noindex`);
}
const slashless = await fetch(origin + "/services", { redirect: "manual" });
if (slashless.status !== 308 || !slashless.headers.get("location")?.endsWith("/services/")) problems.push(`/services did not 308-redirect to /services/`);

// Old permitguys.ca URLs must redirect permanently to live pages.
for (const [from, to] of [["/contact-us/", "/contact/"], ["/get-a-quote", "/contact/"], ["/blogs/some-old-post/", "/permit-guides/"]]) {
  const res = await fetch(origin + from, { redirect: "follow" });
  if (!res.redirected || new URL(res.url).pathname !== to || res.status !== 200) problems.push(`${from} did not redirect to ${to}`);
}

for (const [t, ps] of titles) if (ps.length > 1) problems.push(`duplicate title "${t}" on ${ps.join(", ")}`);
for (const [d, ps] of descriptions) if (ps.length > 1) problems.push(`duplicate description "${d.slice(0, 40)}…" on ${ps.join(", ")}`);

if (expectIndexable && noindexPages.length) console.log(`Intentionally noindex: ${noindexPages.join(", ")}`);
console.log(`Checked ${pages.length} pages and ${jsonLdBlocks} JSON-LD blocks from ${origin} (${expectIndexable ? "indexable" : "non-indexable"} build)`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("✓ All pages passed");
