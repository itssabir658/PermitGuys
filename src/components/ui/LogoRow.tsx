import type { CSSProperties } from "react";
import { logoHeight, type Logo } from "@/content/recognition";
import { cn } from "./cn";

/**
 * A row of logos set as a ruled strip, one cell each, every mark drawn in
 * the ink of the text around it (globals.css, ".logo-row"), so a run of
 * other brands' colours never breaks the page's palette. Each mark's alt
 * text is the name it shows.
 */
/** `columns` is how many to a row on wide screens (all of them by default). */
export function LogoRow({ logos, label, className, onDark, columns }: { logos: Logo[]; label: string; className?: string; onDark?: boolean; columns?: number }) {
  return (
    <ul aria-label={label} className={cn("logo-row", onDark && "logo-row--dark", className)} style={{ "--n": columns ?? logos.length } as CSSProperties}>
      {logos.map((logo) => (
        <li key={logo.src} data-reveal="" className="logo-row__cell">
          {/* eslint-disable-next-line @next/next/no-img-element -- small vector and line-art marks, drawn as they are */}
          <img
            src={logo.src}
            alt={logo.name}
            width={logo.width}
            height={logo.height}
            loading="lazy"
            decoding="async"
            className="logo-row__mark"
            style={{ "--h": `${logoHeight(logo).toFixed(3)}rem` } as CSSProperties}
          />
        </li>
      ))}
    </ul>
  );
}
