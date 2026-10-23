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
  captionOnDark,
  framed,
}: {
  /** Sets the figure on a graphite mount. */
  framed?: boolean;
  /** Set when the figure sits on a dark section, so the caption stays legible. */
  captionOnDark?: boolean;
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
    <figure className={cn("relative", framed && tone === "dark" && "bg-charcoal-900", className)}>
      <div
        className={cn(
          "relative overflow-hidden",
          aspect,
          tone === "dark" ? "bg-charcoal-800 text-ivory/80" : "bg-stone-100 text-ink",
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
        <figcaption className={cn("mt-4 text-label", framed && tone === "dark" && "px-4 pb-4", captionOnDark ? "text-charcoal-300" : "text-ink-muted")}>
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
