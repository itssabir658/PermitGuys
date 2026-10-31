"use client";

import { useState } from "react";
import { GTA_BORDERS, GTA_HEIGHT, GTA_OUTLINE, GTA_WIDTH } from "@/content/gta-map";
import { ExternalIcon } from "./Icons";
import { LinkButtonFace, linkButtonClass } from "./LinkButton";
import { cn } from "./cn";

/*
 * The firm's map of its projects (Google My Maps, site.projectsMap) in a
 * drawing-sheet frame. Until the visitor asks for it the frame shows the
 * Greater Toronto Area as the intro draws it, in ivory line on ink, so
 * nothing is requested from Google on page load and a thumb scrolling the
 * page is never caught by a map. Asked for, the map loads in the frame,
 * its own header in the ink of the frame (ehbc), and the drawing fades
 * away over it once it has loaded.
 */

/** The map's header colour: the page's ink, so the embed's bar reads as the frame's. */
const HEADER = "171716";

const embedUrl = (mid: string) => `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(mid)}&ehbc=${HEADER}`;
export const projectsMapUrl = (mid: string) => `https://www.google.com/maps/d/viewer?mid=${encodeURIComponent(mid)}`;

export function ProjectsMap({ mid, title, className }: { mid: string; title: string; className?: string }) {
  const [asked, setAsked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("projects-map", className)}>
      <div className="projects-map__frame">
        {asked ? (
          <iframe
            title={`Map: ${title}`}
            src={embedUrl(mid)}
            className="projects-map__embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        ) : null}
        <div className={cn("projects-map__cover", loaded && "is-gone")} aria-hidden={asked || undefined}>
          <svg viewBox={`0 0 ${GTA_WIDTH} ${GTA_HEIGHT}`} className="projects-map__gta" fill="none" aria-hidden="true" focusable="false">
            {GTA_OUTLINE.map((d) => (
              <path key={d.slice(0, 32)} d={d} className="projects-map__edge" />
            ))}
            {GTA_BORDERS.map((d) => (
              <path key={d.slice(0, 32)} d={d} className="projects-map__border" />
            ))}
          </svg>
          <p className="projects-map__place">
            Greater Toronto Area and beyond<span className="text-brand-400">.</span>
          </p>
          <div className="projects-map__actions">
            {asked ? (
              <p className="text-label text-stone-300" role="status">
                Loading the map…
              </p>
            ) : (
              <button type="button" onClick={() => setAsked(true)} className={linkButtonClass("light", "whitespace-nowrap")}>
                <LinkButtonFace>Explore the map</LinkButtonFace>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="projects-map__foot">
        <p>Every pin is one of our client projects.</p>
        <a href={projectsMapUrl(mid)} className="tap group inline-flex items-center gap-1.5 text-ink">
          <span className="link-rule">Open in Google My Maps</span>
          <ExternalIcon className="size-3" />
        </a>
      </div>
    </div>
  );
}
