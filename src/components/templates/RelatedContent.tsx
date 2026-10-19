import type { Guide, Service } from "@/content/types";
import { LinkRows } from "@/components/ui/LinkRows";
import { paths } from "@/lib/routes";

/** Contextual internal links shared by every template. */
export function RelatedContent({ services, guides }: { services: Service[]; guides: Guide[] }) {
  return (
    <div className="grid gap-12 xl:grid-cols-2">
      {guides.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-700">Related guides</h3>
          <div className="mt-4">
            <LinkRows items={guides.map((g) => ({ href: paths.guide(g.slug), title: g.title }))} />
          </div>
        </div>
      ) : null}
      {services.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-700">Related services</h3>
          <div className="mt-4">
            <LinkRows items={services.map((s) => ({ href: paths.service(s.slug), title: s.name }))} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
