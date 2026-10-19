import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyTemplate } from "@/components/templates/CaseStudyTemplate";
import { getProject, getProjects } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

// Only approved case studies are generated; every other slug returns 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return pageMetadata({ ...project.seo, path: paths.project(project.slug), type: "article" });
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  return <CaseStudyTemplate project={project} />;
}
