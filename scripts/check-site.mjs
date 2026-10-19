#!/usr/bin/env node
/**
 * Crawls a running build (default http://localhost:3000) from the homepage
 * and checks every internal page for:
 *   - a 200 response, and 404 for a few unknown slugs
 *   - exactly one <h1>, a <title>, a meta description and a canonical URL
 *   - no href="#" links and no internal links to missing pages
 *   - unique titles and descriptions across pages
 * Usage: npm run build && npm start & npm run check:site
 */
const origin = process.argv[2] ?? process.env.SITE_ORIGIN ?? "http://localhost:3000";
const problems = [];
const seen = new Map();
const queue = ["/"];
const titles = new Map();
const descriptions = new Map();

const attr = (html, re) => html.match(re)?.[1];

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

  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) problems.push(`${path} has ${h1s} <h1> elements`);
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title) problems.push(`${path} has no <title>`);
  if (!desc) problems.push(`${path} has no meta description`);
  if (path !== "/404/" && (!canonical || !canonical.endsWith(path))) problems.push(`${path} canonical is ${canonical}`);
  if (title) titles.set(title, [...(titles.get(title) ?? []), path]);
  if (desc) descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);
  if (/href="#"/.test(html)) problems.push(`${path} contains href="#"`);

  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    if (href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href)) continue;
    const clean = href.split("#")[0];
    if (!clean.startsWith("/")) continue;
    if (!clean.endsWith("/") && !/\.[a-z]+$/.test(clean)) problems.push(`${path} links to ${clean} without a trailing slash`);
    if (!seen.has(clean)) queue.push(clean);
  }
}

for (const extra of ["/sitemap.xml", "/robots.txt", "/llms.txt"]) {
  const res = await fetch(origin + extra);
  if (res.status !== 200) problems.push(`${extra} returned ${res.status}`);
}
for (const missing of ["/services/not-a-service/", "/permit-guides/not-a-guide/", "/service-areas/nowhere/", "/projects/not-a-project/"]) {
  const res = await fetch(origin + missing);
  if (res.status !== 404) problems.push(`${missing} returned ${res.status}, expected 404`);
}
for (const [t, ps] of titles) if (ps.length > 1) problems.push(`duplicate title "${t}" on ${ps.join(", ")}`);
for (const [d, ps] of descriptions) if (ps.length > 1) problems.push(`duplicate description "${d.slice(0, 40)}…" on ${ps.join(", ")}`);

console.log(`Checked ${seen.size} pages from ${origin}`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("✓ All pages passed");
