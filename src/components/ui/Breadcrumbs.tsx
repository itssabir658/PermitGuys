import Link from "next/link";
import type { Route } from "next";
import { breadcrumbSchema, webPageSchema, type WebPageType } from "@/lib/jsonld";
import { paths } from "@/lib/routes";
import { JsonLd } from "./JsonLd";

export interface Crumb {
  name: string;
  path: string;
}

export interface PageSchema {
  /** The page's visible name, normally its H1. */
  name: string;
  type?: WebPageType;
  extra?: Record<string, unknown>;
}

/**
 * Visible breadcrumb trail plus matching structured data: the page's WebPage
 * entity and a BreadcrumbList that mirrors the visible trail.
 */
export function Breadcrumbs({ items, onDark, page }: { items: Crumb[]; onDark?: boolean; page: PageSchema }) {
  const trail = [{ name: "Home", path: paths.home }, ...items];
  // On phones a deeper trail stops at the parent: the H1 directly below names the page, and screen readers and the structured data still get it.
  const parentOnPhones = trail.length > 2;
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-label ${onDark ? "text-charcoal-300" : "text-ink-muted"}`}>
          {trail.map((item, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={item.path} className={`flex items-center gap-2 ${last && parentOnPhones ? "max-sm:sr-only" : ""}`}>
                {last ? (
                  // A long title (a guide's question) is cut short here: the H1 below and the structured data carry it in full.
                  <span aria-current="page" className={`max-w-[24ch] truncate sm:max-w-[40ch] ${onDark ? "text-ivory" : "text-ink"}`}>
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path as Route} className="link-draw tap hover:text-ink">
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className={i === trail.length - 2 && parentOnPhones ? "max-sm:hidden" : undefined}>
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={[
          webPageSchema({ path: trail[trail.length - 1].path, name: page.name, type: page.type, extra: page.extra }),
          breadcrumbSchema(trail),
        ]}
      />
    </>
  );
}
