import Image from "next/image";
import type { Visual } from "@/content/types";
import { Drawing } from "./Drawing";
import { cn } from "./cn";

/**
 * Shows a supplied photo when one exists, otherwise a drafted illustration on
 * a drafting grid. The aspect ratio is fixed either way, so nothing shifts
 * when photography is added later.
 */
export function Figure({
  visual,
  className,
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  aspect = "aspect-[4/3]",
  tone = "light",
  caption = true,
}: {
  visual: Visual;
  className?: string;
  priority?: boolean;
  sizes?: string;
  aspect?: string;
  tone?: "light" | "dark";
  caption?: boolean;
}) {
  const { photo } = visual;
  return (
    <figure className={cn("relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          aspect,
          tone === "dark" ? "bg-navy-800 bg-drafting-grid-dark text-paper/80" : "bg-paper-100 bg-drafting-grid text-navy-900",
        )}
      >
        {photo ? (
          <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
        ) : (
          <div role="img" aria-label={visual.alt} className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
            <Drawing variant={visual.drawing} className="h-full w-full max-w-[34rem]" />
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className={cn("mt-3 text-xs tracking-wide", tone === "dark" ? "text-navy-100/60" : "text-ink-muted")}>
          {photo ? (
            <>Photo: {photo.credit} ({photo.licence})</>
          ) : (
            <span data-placeholder="">Illustration. Project photography to be supplied.</span>
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}
