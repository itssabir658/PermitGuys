import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideTemplate } from "@/components/templates/GuideTemplate";
import { getGuide, getGuides } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/permit-guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return pageMetadata({ ...guide.seo, path: paths.guide(guide.slug), type: "article" });
}

export default async function GuidePage({ params }: PageProps<"/permit-guides/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return <GuideTemplate guide={guide} />;
}
