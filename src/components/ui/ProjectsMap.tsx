"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

/*
 * The firm's projects on a map (site.projectsMap): a sheet ruled as the
 * title block is, the projects on a light 3D map of the GTA, and beside it
 * a panel of what a client can count on: the permits issued, the projects
 * on the map, the municipalities and the Google rating.
 *
 * With NEXT_PUBLIC_MAPBOX_TOKEN set the sheet holds a Mapbox map
 * (projects-mapbox.ts), fetched only once the frame nears the screen, so it
 * costs the page nothing until then. Until it has drawn (or without a
 * token) the sheet shows the same projects as red points on its own grid,
 * so it is never empty. The points are blurred to their area
 * (src/content/project-points.ts), never an address.
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
      <g fill="#ee352f" stroke="#ffffff" strokeWidth={r4(H * 0.0016)}>
        {points.map(([lon, lat], i) => (
          <circle key={i} cx={x(lon)} cy={y(lat)} r={r4(H * 0.0042)} />
        ))}
      </g>
    </svg>
  );
}

export interface MapStat {
  value: string;
  label: string;
}

/** `stats`: the first is set large (the permits issued); the rest are listed under it. */
export function ProjectsMap({ points, stats, className }: { points: [number, number][]; stats: MapStat[]; className?: string }) {
  const [lead, ...rest] = stats;
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
      <div className="projects-map__body">
        <div ref={frame} className="projects-map__frame">
          <div className={cn("projects-map__cover", ready && "is-gone")}>
            <DotField points={points} />
          </div>
          {token ? <div ref={canvas} className="projects-map__canvas" role="region" aria-label="Map of our client projects" /> : null}
          <p className="projects-map__legend">
            <span aria-hidden="true" className="projects-map__dot" />
            Client project
            <span aria-hidden="true" className="projects-map__group">12</span>
            Grouped
          </p>
        </div>
        {lead ? (
          <dl className="projects-map__panel">
            <div className="projects-map__lead">
              <dt className="projects-map__label">{lead.label}</dt>
              <dd className="projects-map__figure">{lead.value}</dd>
            </div>
            {rest.map((s) => (
              <div key={s.label} className="projects-map__row">
                <dt className="projects-map__label">{s.label}</dt>
                <dd className="projects-map__value">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="projects-map__foot">
        <p>Each point is a client project, shown by its area rather than its address. Tap or click a numbered circle to open it up.</p>
      </div>
    </div>
  );
}
