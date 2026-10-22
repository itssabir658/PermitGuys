"use client";

import { useState } from "react";
import { ExternalIcon } from "./Icons";
import { cn } from "./cn";

/*
 * Google map behind a click-to-load cover. Nothing is requested from Google
 * until the visitor asks for the map, which keeps pages fast and sets no
 * third-party cookies on page load. With NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY set
 * the official Maps Embed API is used; without it, the standard embed link.
 */

const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

function embedUrl(query: string) {
  const q = encodeURIComponent(query);
  return embedKey ? `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${q}` : `https://www.google.com/maps?q=${q}&output=embed`;
}

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Stylised street plan for the cover, drawn rather than fetched. */
function PlanCover() {
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M-20 300C120 270 210 285 330 240S520 150 640 160" strokeWidth={26} opacity={0.08} />
        <path d="M-20 300C120 270 210 285 330 240S520 150 640 160" strokeWidth={1} strokeDasharray="8 10" opacity={0.35} />
        <path d="M90 -20L150 420M380 -20L300 420M-20 120L640 60" strokeWidth={12} opacity={0.07} />
        <path d="M-20 200L640 330M500 -20L540 420" strokeWidth={6} opacity={0.06} />
        <path d="M200 40h70v50h-70zM420 250h80v60h-80zM60 330h70v40H60zM450 70h60v45h-60z" strokeWidth={1} opacity={0.18} />
        <path d="M0 360C100 345 160 380 260 372S420 340 600 360" stroke="#9aa0a8" strokeWidth={18} opacity={0.18} />
      </g>
    </svg>
  );
}

export function MapCard({ query, label, note, className, onLight }: { query: string; label: string; note?: string; className?: string; onLight?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative isolate", className)}>
      <div className={cn("relative h-full min-h-[22rem] overflow-hidden text-ivory sm:min-h-[26rem]", onLight ? "bg-charcoal-900" : "bg-charcoal-800")}>
        {loaded ? (
          <iframe
            title={`Map: ${label}`}
            src={embedUrl(query)}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <>
                        <PlanCover />
            <span aria-hidden="true" className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-full">
                            <svg viewBox="0 0 32 44" className="relative h-11 w-8 drop-shadow-[0_8px_16px_rgb(0_0_0/0.45)]">
                <path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 43 16 43s15-16 15-27.2C31 7.6 24.3 1 16 1z" fill="#EE352F" />
                <circle cx="16" cy="16" r="5.5" fill="#1c1c1c" />
              </svg>
            </span>
          </>
        )}

        <div className={cn("absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4", loaded && "pointer-events-none")}>
          <div className={cn("pointer-events-auto flex flex-col gap-4 bg-charcoal-950/90 p-5 sm:flex-row sm:items-center sm:justify-between", loaded && "sm:w-fit")}>
            <div>
              <p className="text-label text-charcoal-300">On Google Maps</p>
              <p className="mt-2 font-display text-lg leading-snug text-ivory">{label}</p>
              {note && !loaded ? <p className="mt-1 text-xs text-charcoal-300">{note}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {loaded ? null : (
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  className="inline-flex min-h-11 items-center rounded-full bg-ivory px-5 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-white"
                >
                  Show the map
                </button>
              )}
              <a href={mapsLink(query)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium text-ivory ring-1 ring-ivory/30 transition-colors ring-inset hover:ring-ivory">
                Open in Google Maps
                <ExternalIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
