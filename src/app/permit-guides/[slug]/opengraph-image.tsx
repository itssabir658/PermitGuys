import { getGuide, getGuides } from "@/lib/content";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
// Pre-render one image per page at build time.
export function generateStaticParams() {
  return getGuides().map((item) => ({ slug: item.slug }));
}

export const alt = "PermitGuys permit guide preview";

export default async function Image({ params }: PageProps<"/permit-guides/[slug]">) {
  const guide = getGuide((await params).slug);
  return ogImage({ eyebrow: "Permit guide", title: guide?.title ?? "Permit guides" });
}
