import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/** Opening block for inner pages: breadcrumbs, H1 and a direct answer. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  aside,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-paper pt-10 pb-16 sm:pt-12 lg:pb-24">
      <Container>
        <Breadcrumbs items={crumbs} />
        <div className={aside ? "mt-12 grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16" : "mt-12"}>
          <div className={aside ? "lg:col-span-7" : "max-w-4xl"}>
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <h1 className="mt-5 font-display text-display-lg text-balance text-navy-900">{title}</h1>
            {lead ? <div className="mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-ink-muted sm:text-xl">{lead}</div> : null}
            {children ? <div className="mt-9">{children}</div> : null}
          </div>
          {aside ? <div className="lg:col-span-5">{aside}</div> : null}
        </div>
      </Container>
    </header>
  );
}
