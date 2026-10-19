import type { ReactNode } from "react";
import type { WebPageType } from "@/lib/jsonld";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/**
 * Opening block for inner pages: breadcrumbs, H1 and a direct answer, on the
 * same pale grey drafting ground as the homepage hero so every page opens
 * the same way. Drawings in the aside sit on a charcoal sheet (Figure tone="dark").
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
    <header className="bg-glow-paper relative overflow-hidden text-charcoal-900">
      <div aria-hidden="true" className="bg-drafting-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_95%)]" />
      <Container className="relative pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20">
        <Breadcrumbs items={crumbs} page={{ name: title, type: pageType, extra: schemaExtra }} />
        <div className={aside ? "mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:items-end lg:gap-16" : "mt-12 lg:mt-16"}>
          <div className={aside ? "lg:col-span-7" : "max-w-4xl"}>
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <h1 className="motion-rise mt-6 font-display text-display-xl text-balance">{title}</h1>
            {lead ? <div className="mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-ink-muted sm:text-xl">{lead}</div> : null}
            {children ? <div className="mt-10">{children}</div> : null}
          </div>
          {aside ? <div className="motion-rise-delay lg:col-span-5">{aside}</div> : null}
        </div>
      </Container>
    </header>
  );
}
