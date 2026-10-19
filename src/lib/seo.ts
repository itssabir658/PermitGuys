import type { Metadata } from "next";
import { site } from "@/content/site";

interface PageMeta {
  title: string;
  description: string;
  /** Path with trailing slash, e.g. "/services/deck-permits/". */
  path: string;
  /** Use the title as-is instead of adding the site-name template. */
  absoluteTitle?: boolean;
  noindex?: boolean;
  type?: "website" | "article";
}

/**
 * Builds title, description, canonical URL and social metadata the same way
 * for every page. The canonical is relative and resolved against
 * metadataBase in the root layout.
 */
export function pageMetadata({ title, description, path, absoluteTitle, noindex, type = "website" }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      type,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
