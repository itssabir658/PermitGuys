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
 * Default share image (app/opengraph-image.tsx). Pages that set openGraph
 * replace the root image, so it is listed explicitly here; segments with
 * their own opengraph-image file (services, guides) override it.
 */
const defaultImage = { url: "/opengraph-image/", width: 1200, height: 630, alt: `${site.name}: architecture, engineering and permit drawings in the GTA` };

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
      images: [defaultImage],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [defaultImage] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
