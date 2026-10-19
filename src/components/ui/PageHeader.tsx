import type { ReactNode } from "react";
import type { WebPageType } from "@/lib/jsonld";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/**
 * Opening block for inner pages: breadcrumbs, H1 and a direct answer, set on
 * the same navy drawing sheet as the homepage hero so every page opens with
 * the brand. Children and asides sit on the dark ground; pass onDark to them.
 */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  aside,
  children,
  pageType,
  schemaExtra,
}: {
  crumbs: Crumb[];
  /** schema.org WebPage subtype for this page. */
  pageType?: WebPageType;
  schemaExtra?: Record<string, unknown>;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden bg-navy-900 text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0" />
      <Container className="relative pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20">
        <Breadcrumbs items={crumbs} onDark page={{ name: title, type: pageType, extra: schemaExtra }} />
        <div className={aside ? "mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:items-end lg:gap-16" : "mt-12 lg:mt-16"}>
          <div className={aside ? "lg:col-span-7" : "max-w-4xl"}>
            {eyebrow ? <Eyebrow onDark>{eyebrow}</Eyebrow> : null}
            <h1 className="mt-6 font-display text-display-xl text-balance">{title}</h1>
            {lead ? <div className="mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-navy-100/85 sm:text-xl">{lead}</div> : null}
            {children ? <div className="mt-10">{children}</div> : null}
          </div>
          {aside ? <div className="lg:col-span-5">{aside}</div> : null}
        </div>
      </Container>
    </header>
  );
}
