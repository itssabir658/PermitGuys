import { getService, getServices } from "@/lib/content";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
// Pre-render one image per page at build time.
export function generateStaticParams() {
  return getServices().map((item) => ({ slug: item.slug }));
}

export const alt = "PermitGuys service page preview";

export default async function Image({ params }: PageProps<"/services/[slug]">) {
  const service = getService((await params).slug);
  const eyebrow = service?.category === "commercial" ? "Commercial service" : "Residential service";
  return ogImage({ eyebrow, title: service?.name ?? "Permit services" });
}
