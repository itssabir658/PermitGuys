/**
 * Marketing attribution sent with an inquiry: campaign tags from the URL the
 * visitor first landed on, the referring site's host and the landing path.
 * Captured in the browser (SiteTelemetry) and re-checked on the server,
 * because anything posted from the browser can be tampered with.
 */

export const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "msclkid",
  "referrer_host",
  "landing_page",
  "cta_service",
] as const;

export type AttributionKey = (typeof attributionKeys)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

/** URL parameters copied verbatim when present on the landing page. */
export const campaignParams = attributionKeys.filter((k) => k.startsWith("utm_") || k.endsWith("clid"));

export const ATTRIBUTION_STORAGE_KEY = "pg_attribution";
const MAX_VALUE = 200;

/** Keeps known keys only, as short single-line strings. Never throws. */
export function sanitizeAttribution(raw: unknown): Attribution {
  let data: unknown = raw;
  if (typeof raw === "string") {
    if (raw.length > 4000) return {};
    try {
      data = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Attribution = {};
  for (const key of attributionKeys) {
    const v = (data as Record<string, unknown>)[key];
    if (typeof v !== "string") continue;
    const clean = v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, MAX_VALUE);
    if (clean) out[key] = clean;
  }
  return out;
}

/**
 * Decides what to remember for this browser session. The first page of the
 * session is kept, unless a later page view carries new campaign tags.
 * Only the referring site's host is stored, never the full referring URL.
 */
export function nextAttribution(url: URL, referrer: string, existing: Attribution | null): Attribution | null {
  const campaign: Attribution = {};
  for (const key of campaignParams) {
    const v = url.searchParams.get(key);
    if (v) campaign[key] = v;
  }
  const hasCampaign = Object.keys(campaign).length > 0;
  if (existing && !hasCampaign) return null;

  let referrerHost: string | undefined;
  try {
    const host = referrer ? new URL(referrer).host : "";
    if (host && host !== url.host) referrerHost = host;
  } catch {
    referrerHost = undefined;
  }
  return sanitizeAttribution({ ...campaign, referrer_host: referrerHost, landing_page: url.pathname });
}
