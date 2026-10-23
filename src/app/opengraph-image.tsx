import { site } from "@/content/site";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = `${site.name}: architecture, engineering and permit drawings in the Greater Toronto Area`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Greater Toronto Area", title: "Beautifully designed. Precisely engineered." });
}
