import type { ReactNode } from "react";
import type { WebPageType } from "@/lib/jsonld";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/**
 * Opening block for inner pages: breadcrumbs, a large editorial H1 and a
 * direct answer on the ivory ground, with an optional plate alongside.
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
    <header className="bg-ivory text-ink">
      <Container className="pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-28">
        <Breadcrumbs items={crumbs} page={{ name: title, type: pageType, extra: schemaExtra }} />
        <div className={aside ? "mt-14 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:items-end lg:gap-8" : "mt-14 lg:mt-24"}>
          <div className={aside ? "lg:col-span-7" : "max-w-5xl"}>
            {eyebrow ? <Eyebrow className="motion-rise">{eyebrow}</Eyebrow> : null}
            <h1 className="motion-rise mt-8 font-display text-display-xl font-light text-balance">{title}</h1>
            {lead ? <div className="motion-rise-delay mt-8 max-w-2xl text-lede text-pretty text-ink-muted">{lead}</div> : null}
            {children ? <div className="motion-rise-delay mt-12 max-w-2xl">{children}</div> : null}
          </div>
          {aside ? <div className="lg:col-span-4 lg:col-start-9">{aside}</div> : null}
        </div>
        <div aria-hidden="true" data-reveal="" data-reveal-type="rule" className="mt-16 h-px bg-line lg:mt-24" />
      </Container>
    </header>
  );
}
