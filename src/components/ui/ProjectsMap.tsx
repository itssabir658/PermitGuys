"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

/*
 * The firm's projects on a map (site.projectsMap): a sheet ruled as the
 * title block is, ink inside, every client project a red dot, and the
 * number of permits the firm has had issued set large over it.
 *
 * With NEXT_PUBLIC_MAPBOX_TOKEN set the sheet holds a Mapbox map in the
 * site's palette (projects-mapbox.ts), fetched only once the frame nears
 * the screen, so it costs the page nothing until then. Until it has drawn
 * (or without a token), the sheet shows the same dots plotted
 * on its own grid, so it is never empty. The points are blurred to their
 * area (src/content/project-points.ts), never an address.
 */

/** The Mapbox public token, read at build time (NEXT_PUBLIC_MAPBOX_TOKEN; see .env.example). */
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** The GTA, as the drawn fallback frames it: west, south, east, north. */
const BOX = [-80.05, 43.28, -78.75, 44.12] as const;
/** East–west degrees are shorter than north–south ones at this latitude (cos 43.7°). Rounded, so the server and the browser draw the same numbers. */
const KX = 0.723;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const W = r4((BOX[2] - BOX[0]) * KX);
const H = r4(BOX[3] - BOX[1]);
const x = (lon: number) => r4((lon - BOX[0]) * KX);
const y = (lat: number) => r4(BOX[3] - lat);

function DotField({ points }: { points: [number, number][] }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="projects-map__field" aria-hidden="true" focusable="false">
      <defs>
        <filter id="projects-map-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r4(H * 0.012)} />
        </filter>
      </defs>
      <g fill="#ee352f">
        <g filter="url(#projects-map-glow)" opacity={0.35}>
          {points.map(([lon, lat], i) => (
            <circle key={i} cx={x(lon)} cy={y(lat)} r={r4(H * 0.006)} />
          ))}
        </g>
        {points.map(([lon, lat], i) => (
          <circle key={i} cx={x(lon)} cy={y(lat)} r={r4(H * 0.0028)} />
        ))}
      </g>
    </svg>
  );
}

export function ProjectsMap({
  points,
  permits,
  className,
}: {
  points: [number, number][];
  /** The permits issued, as the business states it ("2,000+"). */
  permits: string;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!token || !el) return;
    let unmount: (() => void) | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("./projects-mapbox").then(({ mountProjectsMapbox }) => {
          if (cancelled || !canvas.current) return;
          unmount = mountProjectsMapbox(canvas.current, token, points, () => setReady(true));
        });
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      unmount?.();
    };
  }, [points]);

  return (
    <div className={cn("projects-map", className)}>
      <div ref={frame} className="projects-map__frame">
        <div className={cn("projects-map__cover", ready && "is-gone")}>
          <DotField points={points} />
        </div>
        {token ? <div ref={canvas} className="projects-map__canvas" role="region" aria-label="Map of our client projects" /> : null}
        <div className="projects-map__stat">
          <p className="projects-map__figure">{permits}</p>
          <p className="projects-map__label">
            Permits issued<span className="text-brand-400">.</span>
          </p>
        </div>
        <p className="projects-map__legend">
          <span aria-hidden="true" className="projects-map__dot" />
          Client project
        </p>
      </div>
      <div className="projects-map__foot">
        <p>Each dot is a client project, shown by its area rather than its address.</p>
      </div>
    </div>
  );
}
