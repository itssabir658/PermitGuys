import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/routes";

/**
 * Search engines and AI answer engines named explicitly, so a stricter
 * default never shuts them out by accident: Google and Bing search, ChatGPT
 * search (OAI-SearchBot) and ChatGPT's live browsing (ChatGPT-User),
 * Perplexity, Claude, Apple, and the AI-training tokens (GPTBot,
 * Google-Extended, Applebot-Extended, ClaudeBot), which the business allows
 * so its pages can inform AI answers. Every crawler is kept out of /api/.
 */
export const aiAndSearchCrawlers = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "DuckDuckBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (!site.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: [...aiAndSearchCrawlers], allow: "/", disallow: "/api/" },
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml", site.url),
  };
}
