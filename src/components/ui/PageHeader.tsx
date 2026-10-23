import type { ReactNode } from "react";
import type { WebPageType } from "@/lib/jsonld";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/**
 * Opening block for inner pages: breadcrumbs, a large editorial H1 and a
 * direct answer on the ivory ground, with an optional plate alongside.
 *
 * It enters once the preloader or the page transition lifts (globals.css,
 * "Inner pages"): the breadcrumb fades in, the eyebrow and the title's
 * lines rise out of their masks (InteractionEffects splits the title), the
 * lead follows at 0.4s, an aside plate unveils upward and the closing rule
 * draws across. On short laptop screens (at most 800px, then 700px tall)
 * the spacing tightens in two steps, so a picture band below shows a real
 * part of itself at the fold rather than a sliver.
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
      <Container className="pt-28 pb-10 sm:pt-32 sm:pb-12 lg:pt-36 lg:pb-14 lg:[@media(43.75rem<height<=50rem)]:pt-28 lg:[@media(43.75rem<height<=50rem)]:pb-10 lg:[@media(height<=43.75rem)]:pt-24 lg:[@media(height<=43.75rem)]:pb-8">
        <div className="page-crumbs">
          <Breadcrumbs items={crumbs} page={{ name: title, type: pageType, extra: schemaExtra }} />
        </div>
        <div className={aside ? "mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:items-end lg:gap-8 lg:[@media(43.75rem<height<=50rem)]:mt-10 lg:[@media(height<=43.75rem)]:mt-8" : "mt-10 lg:mt-14 lg:[@media(43.75rem<height<=50rem)]:mt-10 lg:[@media(height<=43.75rem)]:mt-8"}>
          <div className={aside ? "lg:col-span-7" : "max-w-5xl"}>
            {eyebrow ? (
              <div className="split-line">
                <Eyebrow className="page-eyebrow">{eyebrow}</Eyebrow>
              </div>
            ) : null}
            <h1 data-reveal-lines="entrance" className="page-title mt-8 font-display text-display-xl font-light text-balance">
              {title}
            </h1>
            {lead ? <div className="motion-rise mt-8 max-w-2xl text-lede text-pretty text-ink-muted">{lead}</div> : null}
            {children ? <div className={lead ? "motion-rise-delay mt-12 max-w-2xl" : "motion-rise mt-12 max-w-2xl"}>{children}</div> : null}
          </div>
          {aside ? <div className="lg:col-span-4 lg:col-start-9">{aside}</div> : null}
        </div>
        <div aria-hidden="true" className="page-rule mt-10 h-px bg-line lg:mt-14 lg:[@media(43.75rem<height<=50rem)]:mt-10 lg:[@media(height<=43.75rem)]:mt-8" />
      </Container>
    </header>
  );
}
