"use client";

import { MK_H, MK_W, mkCallouts, mkElevation, mkPlan, mkSite, mkStructure } from "@/content/making-drawing";

/*
 * The making of a house's drawings: the site plan, floor plan, elevation,
 * structure and sheet border (Making.tsx). A client component only so that
 * their long path data travels once, in a cached script, instead of twice in
 * the page's HTML (the markup and the server component payload). The markup
 * is the same either way, rendered on the server, and HomeMotion draws it.
 */

const view = `0 0 ${MK_W} ${MK_H}`;
/** The sheet's border and its title block's frame, in the board's units (the block itself is HTML, .mk-title). */
const sheetD = (() => {
  const r = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y1}M${x2} ${y1}L${x2} ${y2}M${x2} ${y2}L${x1} ${y2}M${x1} ${y2}L${x1} ${y1}`;
  return r(36, 36, MK_W - 36, MK_H - 36) + r(56, 56, MK_W - 56, MK_H - 56);
})();
export function MakingDrawings() {
  return (
    <>
      <svg data-mk-fade="site" data-mk-zoom="" className="mk-svg" viewBox={view} aria-hidden="true">
        <path data-mk-fade="siteHouse" className="mk-poche" d={mkSite.house} />
        <path data-mk-draw="siteFine" className="mk-hair" d={mkSite.fine} />
        <path data-mk-draw="siteWays" className="mk-thin" d={mkSite.ways} />
        <path data-mk-draw="siteLot" className="mk-heavy" d={mkSite.lot} />
        <g data-mk-fade="siteLabels">
          {mkSite.labels.map((l) => (
            <text key={l.text} x={l.x} y={l.y}>
              {l.text}
            </text>
          ))}
        </g>
      </svg>

      <svg data-mk-fade="plan" className="mk-svg" viewBox={view} aria-hidden="true">
        <path data-mk-fade="planPoche" className="mk-poche" d={mkPlan.poche} />
        <path data-mk-fade="planPoche" className="mk-cut" d={mkPlan.cuts} />
        <path data-mk-draw="planWalls" className="mk-mid" d={mkPlan.walls} />
        <path data-mk-draw="planOpenings" className="mk-thin" d={mkPlan.openings} />
        <path data-mk-draw="planDoors" className="mk-hair" d={mkPlan.doors} />
        <path data-mk-draw="planFittings" className="mk-hair" d={mkPlan.fittings} />
        <g data-mk-fade="planLabels">
          {mkPlan.labels.map((l, i) => (
            <text key={i} x={l.x} y={l.y}>
              {l.text}
            </text>
          ))}
        </g>
      </svg>

      <svg data-mk-fade="lines" className="mk-svg" viewBox={view} aria-hidden="true">
        <path data-mk-draw="elevJoints" className="mk-hair" d={mkElevation.joints} />
        <path data-mk-draw="elevMullions" className="mk-thin" d={mkElevation.mullions} />
        <path data-mk-draw="elevOpenings" className="mk-mid" d={mkElevation.openings} />
        <path data-mk-draw="elevPanels" className="mk-mid" d={mkElevation.panels} />
        <path data-mk-draw="elevOutline" className="mk-heavy" d={mkElevation.outline} />
        <path data-mk-draw="elevGround" className="mk-heavy" d={mkElevation.ground} />
      </svg>

      <svg data-mk-fade="eng" className="mk-svg" viewBox={view} aria-hidden="true">
        <path data-mk-draw="engHidden" className="mk-red-hidden" d={mkStructure.hidden} />
        <path data-mk-draw="engSolid" className="mk-red" d={mkStructure.solid} />
        {/* The callouts in two layouts, one shown for the board's width (globals.css). */}
        <g data-mk-fade="engLabels">
          {(["wide", "narrow"] as const).map((k) => (
            <g key={k} className={`mk-callouts mk-callouts--${k}`}>
              <path className="mk-red-hidden" d={mkCallouts[k].d} />
              {mkCallouts[k].labels.map((l) => (
                <text key={l.text} x={l.x} y={l.y} className="mk-eng-label">
                  {l.text}
                </text>
              ))}
            </g>
          ))}
        </g>
      </svg>

      <svg data-mk-fade="sheet" className="mk-svg" viewBox={view} aria-hidden="true">
        <path data-mk-draw="sheet" className="mk-mid" d={sheetD} />
      </svg>
    </>
  );
}
