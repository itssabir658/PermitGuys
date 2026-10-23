import Image from "next/image";
import type { CSSProperties } from "react";
import { plateNote, type Plate as PlateData } from "@/content/imagery";
import { cn } from "./cn";

/**
 * An image set as a plate: a fixed crop (or the picture's own proportions,
 * aspect="natural") that unveils upwards as it scrolls into view, with
 * optional slow drift, and a mono caption in the manner of a numbered
 * figure. The caption carries the plate's note, client rendering or study;
 * note={false} leaves it to the page, where one line says it for every
 * picture.
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
  fig,
  caption = true,
  drift,
  reveal = true,
  onDark,
  delay,
  focus,
  notch,
  stackCaption,
  note = true,
  label,
}: {
  plate: PlateData;
  /** Aspect ratio utility for the crop, or "natural" for the picture's own proportions. */
  aspect?: string;
  className?: string;
  frameClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Figure number shown in the caption ("01"). */
  fig?: string;
  caption?: boolean;
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
  /** Set the caption's label and note one above the other, for narrow plates. */
  stackCaption?: boolean;
  /** Show the plate's note in the caption. */
  note?: boolean;
  /** Caption text in place of the plate's own. */
  label?: string;
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
      {caption ? (
        <figcaption
          className={cn(
            "mt-4 flex text-label",
            stackCaption ? "flex-col gap-1 text-pretty" : "flex-wrap items-baseline justify-between gap-x-6 gap-y-1",
            onDark ? "text-charcoal-300" : "text-ink-muted",
          )}
        >
          <span>
            {fig ? <span className={onDark ? "text-ivory" : "text-ink"}>Fig. {fig}</span> : null}
            {fig ? <span aria-hidden="true"> — </span> : null}
            {label ?? plate.caption}
          </span>
          {note ? <span>{plateNote(plate)}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
