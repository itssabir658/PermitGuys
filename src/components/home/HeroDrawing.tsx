import type { ReactNode } from "react";

/*
 * Front elevation of a GTA bungalow with a proposed second storey, drawn the
 * way a permit set shows it: existing work in solid line, work to be removed
 * dashed, new work in copper, with level datums and a legend. It is an
 * illustration, not a real project, and is captioned as such.
 *
 * Pure SVG: no requests, no layout shift, crisp at any width.
 */

const MONO = "var(--font-mono), ui-monospace, monospace";

function Note({ x, y, children, anchor = "start", fill = "currentColor", opacity = 0.75 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; fill?: string; opacity?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} stroke="none" opacity={opacity} fontSize={9.5} letterSpacing={1.6} fontFamily={MONO}>
      {children}
    </text>
  );
}

/** Level datum: half-filled target with a dashed level line and a label. */
function Datum({ y, label, accent, isNew }: { y: number; label: string; accent: string; isNew?: boolean }) {
  const colour = isNew ? accent : "currentColor";
  return (
    <g>
      <line x1={512} y1={y} x2={626} y2={y} stroke={colour} strokeWidth={0.75} strokeDasharray="2 4" opacity={isNew ? 0.9 : 0.5} />
      <circle cx={636} cy={y} r={6.5} fill="none" stroke={colour} strokeWidth={1} />
      <path d={`M636 ${y - 6.5}A6.5 6.5 0 0 1 642.5 ${y}H636Z M636 ${y + 6.5}A6.5 6.5 0 0 1 629.5 ${y}H636Z`} fill={colour} stroke="none" />
      <Note x={650} y={y + 3.5} fill={colour} opacity={isNew ? 1 : 0.7}>
        {label}
      </Note>
    </g>
  );
}

function Window({ x, y, w, h, lights = 2 }: { x: number; y: number; w: number; h: number; lights?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} />
      {Array.from({ length: lights - 1 }, (_, i) => (
        <line key={i} x1={x + ((i + 1) * w) / lights} y1={y} x2={x + ((i + 1) * w) / lights} y2={y + h} strokeWidth={0.75} />
      ))}
      <line x1={x - 4} y1={y + h + 3} x2={x + w + 4} y2={y + h + 3} strokeWidth={1.25} />
    </g>
  );
}

export function HeroDrawing({ className, accent = "#E2B18C" }: { className?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 760 530" className={className} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinejoin="round" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="pg-hero-brick" width="22" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 6.5H22M11 0V6.5" stroke="currentColor" strokeWidth={0.5} opacity={0.22} />
        </pattern>
        <mask id="pg-hero-openings">
          <rect x={150} y={320} width={350} height={108} fill="white" />
          <rect x={181} y={351} width={78} height={58} fill="black" />
          <rect x={391} y={351} width={78} height={58} fill="black" />
          <rect x={286} y={326} width={78} height={102} fill="black" />
        </mask>
      </defs>

      {/* Street tree, for scale */}
      <g opacity={0.4} strokeWidth={1}>
        <path d="M66 440V352M66 392L50 374M66 380L84 362" />
        <path d="M28 330C14 316 20 290 40 286C40 262 66 252 82 266C100 254 124 268 118 290C134 300 128 330 108 334C102 350 78 354 66 344C52 352 30 346 28 330Z" />
      </g>

      {/* Ground and grade hatch */}
      <line x1={0} y1={440} x2={626} y2={440} strokeWidth={1.75} />
      {Array.from({ length: 31 }, (_, i) => (
        <line key={i} x1={8 + i * 20} y1={442} x2={0 + i * 20} y2={452} strokeWidth={0.6} opacity={0.45} />
      ))}

      {/* Existing ground floor, brick */}
      <rect x={150} y={320} width={350} height={108} fill="url(#pg-hero-brick)" stroke="none" mask="url(#pg-hero-openings)" />
      <path d="M150 320V440M500 320V440" />
      <line x1={146} y1={428} x2={504} y2={428} strokeWidth={0.9} />
      <Window x={185} y={355} w={70} h={50} lights={3} />
      <Window x={395} y={355} w={70} h={50} lights={3} />

      {/* Porch and front door */}
      <path d="M288 350L325 328L362 350Z" strokeWidth={1.1} />
      <path d="M294 350V428M356 350V428" strokeWidth={0.9} />
      <rect x={307} y={360} width={36} height={68} />
      <line x1={337} y1={394} x2={337} y2={398} strokeWidth={1.5} />
      <rect x={298} y={428} width={54} height={6} strokeWidth={0.9} />
      <rect x={292} y={434} width={66} height={6} strokeWidth={0.9} />

      {/* Existing roof, to be removed */}
      <path d="M134 320L325 254L516 320" strokeDasharray="6 5" opacity={0.55} strokeWidth={1} />

      {/* Proposed second storey and roof */}
      <g stroke={accent}>
        <rect x={150} y={200} width={350} height={120} strokeWidth={1.5} />
        <path d="M128 200L325 128L522 200Z" strokeWidth={1.5} />
        <line x1={128} y1={206} x2={522} y2={206} strokeWidth={0.75} />
        <Window x={180} y={232} w={52} h={58} />
        <Window x={299} y={232} w={52} h={58} />
        <Window x={418} y={232} w={52} h={58} />
        <rect x={364} y={150} width={22} height={34} strokeWidth={1} />
      </g>

      {/* Dimension string over the new storey */}
      <g stroke={accent} strokeWidth={0.9}>
        <line x1={150} y1={96} x2={500} y2={96} />
        <line x1={150} y1={88} x2={150} y2={120} opacity={0.6} />
        <line x1={500} y1={88} x2={500} y2={120} opacity={0.6} />
        <line x1={145} y1={101} x2={155} y2={91} />
        <line x1={495} y1={101} x2={505} y2={91} />
      </g>
      <Note x={325} y={88} anchor="middle" fill={accent} opacity={1}>
        NEW SECOND STOREY ON EXISTING FOOTPRINT
      </Note>

      {/* Level datums */}
      <Datum y={128} label="RIDGE, NEW" accent={accent} isNew />
      <Datum y={200} label="EAVES, NEW" accent={accent} isNew />
      <Datum y={320} label="SECOND FLOOR" accent={accent} />
      <Datum y={440} label="GRADE" accent={accent} />

      {/* Legend */}
      <g transform="translate(150 486)">
        <line x1={0} y1={0} x2={26} y2={0} />
        <Note x={36} y={3.5}>EXISTING</Note>
        <line x1={130} y1={0} x2={156} y2={0} strokeDasharray="6 5" opacity={0.6} />
        <Note x={166} y={3.5}>TO BE REMOVED</Note>
        <line x1={300} y1={0} x2={326} y2={0} stroke={accent} strokeWidth={1.5} />
        <Note x={336} y={3.5} fill={accent} opacity={1}>
          PROPOSED
        </Note>
      </g>
    </svg>
  );
}
