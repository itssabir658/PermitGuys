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
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${onDark ? "text-navy-100/70" : "text-ink-muted"}`}>
          {trail.map((item, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className={onDark ? "text-paper" : "text-navy-900"}>
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path as Route} className="underline-offset-4 hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true" className="text-copper-500">/</span>
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
