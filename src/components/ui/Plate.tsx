import Image from "next/image";
import type { CSSProperties } from "react";
import { plateNote, type Plate as PlateData } from "@/content/imagery";
import { cn } from "./cn";

/**
 * An image set as a plate: a fixed crop (or the picture's own proportions,
 * aspect="natural") that unveils upwards as it scrolls into view, with
 * optional slow drift, and a one-line mono caption with the plate's note,
 * client rendering or study. note={false} leaves it to the page, where one
 * line says it for every picture.
 *
 * In the first screen, pass reveal={false} and frameClassName="motion-unveil"
 * so the plate unveils with the page header instead (globals.css, "Inner
 * pages"); its caption fades in once the picture is up. `notch` cuts the
 * frame to the homepage's notched drawing sheet (NotchClipDefs, in the root
 * layout); the notch sits on a wrapper because the unveil animates the
 * frame's own clip-path.
 */
export function Plate({
  plate,
  aspect = "aspect-[4/5]",
  className,
  frameClassName,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  drift,
  reveal = true,
  onDark,
  delay,
  focus,
  notch,
  note = true,
}: {
  plate: PlateData;
  /** Aspect ratio utility for the crop, or "natural" for the picture's own proportions. */
  aspect?: string;
  className?: string;
  frameClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Slow scroll-linked drift inside the crop. */
  drift?: "slow" | "normal";
  reveal?: boolean;
  onDark?: boolean;
  /** Reveal delay in milliseconds, to stagger neighbouring plates. */
  delay?: number;
  /** Overrides the plate's own object-position. */
  focus?: string;
  /** Frame the picture as a notched drawing sheet. */
  notch?: boolean;
  /** Caption the picture with the plate's note. */
  note?: boolean;
}) {
  const natural = aspect === "natural";
  const frame = (
    <div
      data-reveal={reveal ? "" : undefined}
      data-reveal-type={reveal ? "mask" : undefined}
      style={{ ...(delay ? ({ "--d": delay } as CSSProperties) : {}), ...(natural ? { aspectRatio: `${plate.width} / ${plate.height}` } : {}) }}
      className={cn("grain relative overflow-hidden bg-stone-300", !natural && aspect, frameClassName)}
    >
      <div data-parallax={drift === "slow" ? "slow" : drift ? "" : undefined} className="absolute inset-0">
        <Image
          src={plate.src}
          alt={plate.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={80}
          className="object-cover"
          style={{ objectPosition: focus ?? plate.focus ?? "50% 50%" }}
        />
      </div>
    </div>
  );
  return (
    <figure className={cn("relative", className)}>
      {notch ? <div className="notch-clip">{frame}</div> : frame}
      {note ? <figcaption className={cn("mt-4 text-label text-pretty", onDark ? "text-charcoal-300" : "text-ink-muted")}>{plateNote(plate)}</figcaption> : null}
    </figure>
  );
}
