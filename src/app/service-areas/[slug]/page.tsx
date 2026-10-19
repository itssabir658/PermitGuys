import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationTemplate } from "@/components/templates/LocationTemplate";
import { getLocation, getLocations } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

// Only confirmed municipalities are generated; every other slug returns 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLocations().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/service-areas/[slug]">): Promise<Metadata> {
  const location = getLocation((await params).slug);
  if (!location) return {};
  return pageMetadata({ ...location.seo, path: paths.serviceArea(location.slug) });
}

export default async function LocationPage({ params }: PageProps<"/service-areas/[slug]">) {
  const location = getLocation((await params).slug);
  if (!location) notFound();
  return <LocationTemplate location={location} />;
}
