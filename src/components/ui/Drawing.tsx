import type { ReactNode } from "react";
import type { DrawingVariant } from "@/content/types";

/*
 * Drafted line illustrations in the style of permit drawings. They stand in
 * for photography until licensed images are supplied (see docs/IMAGES.md),
 * and stay useful afterwards as section accents. Pure SVG: no requests, no
 * layout shift, scales to any width.
 */

const INK = "currentColor";
const RED = "#EE352F";

function Dim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g stroke={RED} strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <line x1={x1 - 4} y1={y + 4} x2={x1 + 4} y2={y - 4} />
      <line x1={x2 - 4} y1={y + 4} x2={x2 + 4} y2={y - 4} />
      <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fill={RED} stroke="none" fontSize={9} letterSpacing={1.5} fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

function Label({ x, y, children, anchor = "start" }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={INK} opacity={0.7} fontSize={8.5} letterSpacing={1.6} fontFamily="ui-monospace, monospace">
      {children}
    </text>
  );
}

function Windows({ x, y, cols, rows, w, h, gap }: { x: number; y: number; cols: number; rows: number; w: number; h: number; gap: number }) {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (w + gap);
      const wy = y + r * (h + gap);
      out.push(
        <g key={`${r}-${c}`}>
          <rect x={wx} y={wy} width={w} height={h} />
          <line x1={wx + w / 2} y1={wy} x2={wx + w / 2} y2={wy + h} strokeWidth={0.75} />
        </g>,
      );
    }
  return <>{out}</>;
}

function Ground({ y = 300 }: { y?: number }) {
  return (
    <g>
      <line x1={20} y1={y} x2={460} y2={y} strokeWidth={1.75} />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={24 + i * 20} y1={y + 2} x2={16 + i * 20} y2={y + 10} strokeWidth={0.6} opacity={0.5} />
      ))}
    </g>
  );
}

const variants: Record<DrawingVariant, () => ReactNode> = {
  addition: () => (
    <>
      <Ground />
      <polygon points="70,150 180,72 290,150" />
      <rect x={84} y={150} width={192} height={150} />
      <Windows x={104} y={172} cols={3} rows={1} w={34} h={44} gap={22} />
      <Windows x={104} y={240} cols={1} rows={1} w={34} h={44} gap={0} />
      <rect x={198} y={236} width={34} height={64} />
      <rect x={168} y={110} width={24} height={24} />
      <g stroke={RED} strokeDasharray="5 4" strokeWidth={1.5}>
        <rect x={276} y={190} width={124} height={110} />
        <line x1={270} y1={190} x2={406} y2={190} />
      </g>
      <g stroke={RED} strokeWidth={1}>
        <rect x={298} y={218} width={36} height={44} />
        <rect x={350} y={218} width={30} height={82} />
      </g>
      <Dim x1={276} x2={400} y={172} label="PROPOSED" />
      <Label x={86} y={330}>EXISTING DWELLING</Label>
      <Label x={400} y={330} anchor="end">REAR ADDITION</Label>
    </>
  ),
  "custom-home": () => (
    <>
      <Ground />
      <rect x={70} y={170} width={170} height={130} />
      <rect x={240} y={110} width={170} height={190} />
      <line x1={60} y1={170} x2={250} y2={170} strokeWidth={1.75} />
      <line x1={230} y1={110} x2={420} y2={110} strokeWidth={1.75} />
      <Windows x={90} y={196} cols={2} rows={1} w={56} h={72} gap={18} />
      <rect x={262} y={134} width={126} height={56} />
      <line x1={304} y1={134} x2={304} y2={190} strokeWidth={0.75} />
      <line x1={346} y1={134} x2={346} y2={190} strokeWidth={0.75} />
      <rect x={262} y={214} width={40} height={86} />
      <g stroke={RED}>
        <rect x={318} y={214} width={70} height={60} />
      </g>
      <Dim x1={70} x2={410} y={92} label="FRONT ELEVATION" />
      <Label x={70} y={330}>NEW DWELLING · ELEV. A</Label>
    </>
  ),
  commercial: () => (
    <>
      <Ground />
      <rect x={60} y={90} width={360} height={210} />
      <line x1={50} y1={90} x2={430} y2={90} strokeWidth={1.75} />
      <rect x={60} y={90} width={360} height={26} />
      <Windows x={78} y={134} cols={6} rows={1} w={42} h={50} gap={14} />
      <line x1={60} y1={200} x2={420} y2={200} />
      <g stroke={RED} strokeWidth={1.25}>
        <rect x={78} y={214} width={200} height={86} />
        <line x1={178} y1={214} x2={178} y2={300} />
      </g>
      <rect x={300} y={214} width={56} height={86} />
      <rect x={370} y={214} width={34} height={50} />
      <Dim x1={78} x2={278} y={330} label="TENANT FIT-OUT" />
      <Label x={60} y={80}>COMMERCIAL UNIT · STOREFRONT</Label>
    </>
  ),
  landlord: () => (
    <>
      <Ground />
      <polygon points="90,140 240,64 390,140" />
      <rect x={104} y={140} width={272} height={160} />
      <line x1={104} y1={220} x2={376} y2={220} stroke={RED} strokeWidth={1.5} strokeDasharray="6 4" />
      <Windows x={128} y={160} cols={4} rows={1} w={36} h={40} gap={24} />
      <Windows x={128} y={238} cols={2} rows={1} w={36} h={40} gap={24} />
      <rect x={272} y={236} width={34} height={64} />
      <rect x={322} y={236} width={34} height={64} stroke={RED} />
      <Label x={384} y={186}>UNIT 2</Label>
      <Label x={384} y={266}>UNIT 1</Label>
      <Label x={104} y={330}>FIRE SEPARATION BETWEEN UNITS</Label>
    </>
  ),
  basement: () => (
    <>
      <polygon points="80,120 220,50 360,120" />
      <rect x={94} y={120} width={252} height={110} />
      <line x1={20} y1={230} x2={460} y2={230} strokeWidth={1.75} />
      <rect x={94} y={230} width={252} height={84} stroke={RED} strokeWidth={1.5} />
      <line x1={94} y1={230} x2={346} y2={230} stroke={RED} strokeWidth={3} opacity={0.35} />
      <Windows x={118} y={142} cols={3} rows={1} w={34} h={42} gap={26} />
      <rect x={268} y={166} width={34} height={64} />
      <g stroke={RED} strokeWidth={1}>
        <rect x={118} y={238} width={40} height={18} />
        <polyline points="360,230 360,250 382,250 382,270 404,270 404,290 426,290" />
        <rect x={312} y={252} width={26} height={62} />
      </g>
      <Label x={100} y={290}>SECOND UNIT · BELOW GRADE</Label>
      <Label x={360} y={318}>SEPARATE ENTRANCE</Label>
    </>
  ),
  deck: () => (
    <>
      <Ground />
      <rect x={60} y={100} width={130} height={200} />
      <line x1={190} y1={170} x2={410} y2={170} strokeWidth={1.75} />
      <rect x={190} y={170} width={220} height={10} />
      {[214, 290, 366].map((x) => (
        <g key={x}>
          <rect x={x} y={180} width={10} height={120} />
          <rect x={x - 8} y={300} width={26} height={10} stroke={RED} />
        </g>
      ))}
      <g strokeWidth={0.75}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={196 + i * 18} y1={130} x2={196 + i * 18} y2={170} />
        ))}
        <line x1={190} y1={130} x2={410} y2={130} strokeWidth={1.25} />
      </g>
      <polyline points="410,180 428,180 428,206 446,206 446,232 464,232" stroke={RED} />
      <Dim x1={190} x2={410} y={110} label="GUARD" />
      <Label x={196} y={334}>FOOTINGS · POSTS · BEAMS</Label>
    </>
  ),
  interior: () => (
    <>
      <rect x={50} y={50} width={380} height={260} strokeWidth={4} />
      <line x1={50} y1={170} x2={200} y2={170} strokeWidth={4} />
      <line x1={300} y1={50} x2={300} y2={150} strokeWidth={4} />
      <line x1={200} y1={170} x2={430} y2={170} stroke={RED} strokeWidth={2} strokeDasharray="8 6" />
      <path d="M 300 150 A 30 30 0 0 1 330 180" strokeWidth={0.75} />
      <rect x={340} y={230} width={70} height={60} strokeWidth={0.75} />
      <circle cx={90} cy={110} r={18} strokeWidth={0.75} />
      <g stroke={RED} strokeWidth={1}>
        <rect x={250} y={164} width={14} height={12} />
      </g>
      <Label x={210} y={160}>WALL REMOVED · NEW BEAM</Label>
      <Label x={60} y={300}>PROPOSED FLOOR PLAN</Label>
    </>
  ),
  plan: () => (
    <>
      <rect x={40} y={40} width={400} height={280} strokeWidth={3.5} />
      <line x1={40} y1={160} x2={250} y2={160} strokeWidth={3.5} />
      <line x1={250} y1={40} x2={250} y2={210} strokeWidth={3.5} />
      <line x1={250} y1={250} x2={250} y2={320} strokeWidth={3.5} />
      <line x1={330} y1={160} x2={440} y2={160} strokeWidth={3.5} />
      <path d="M 250 210 A 40 40 0 0 1 290 250" strokeWidth={0.75} />
      <rect x={60} y={190} width={90} height={110} strokeWidth={0.75} />
      <rect x={290} y={60} width={130} height={80} strokeWidth={0.75} />
      <g stroke={RED} strokeWidth={1}>
        <rect x={250} y={160} width={80} height={50} strokeDasharray="5 4" />
      </g>
      <Dim x1={40} x2={440} y={24} label="OVERALL" />
      <Label x={60} y={140}>LIVING</Label>
      <Label x={270} y={300}>KITCHEN</Label>
    </>
  ),
};

export function Drawing({ variant, className }: { variant: DrawingVariant; className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth={1.25}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {variants[variant]()}
    </svg>
  );
}
