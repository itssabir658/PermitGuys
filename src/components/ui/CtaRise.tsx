"use client";

import { useEffect } from "react";
import { engine, measureRange, ORDER, setStyle, type Range } from "@/lib/motion/engine";
import { footerLift, footerProgress } from "@/lib/motion/footer";

/*
 * A closing CtaPanel that comes up the way the footer does (MotionRoot,
 * footer module): its content rises out from under the sheet above it,
 * whose lower edge (the panel's top, overflow: clip) hides it until it
 * lags into place. The same pure functions of the scroll, so it plays back
 * on the way up; with reduced motion or on the still layout it sits in
 * place. Renders nothing: it finds its panel by data-cta-rise.
 */
export function CtaRise() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-cta-rise]");
    const inner = el?.firstElementChild;
    if (!el || !(inner instanceof HTMLElement)) return;
    let r: Range;
    let height = 0;
    const off = engine.register({
      order: ORDER.footer - 1,
      measure() {
        r = measureRange(el);
        height = document.documentElement.scrollHeight;
      },
      update(f) {
        if (f.reduced || !f.tracks) {
          setStyle(inner, "transform", "");
          return;
        }
        const x = footerProgress(f.scroll, f.vh, r.top, r.height, height);
        const y = footerLift(x, r.height, f.vh);
        setStyle(inner, "transform", y < -0.005 ? `translate3d(0, ${y.toFixed(2)}px, 0)` : "");
      },
    });
    return () => {
      off();
      setStyle(inner, "transform", "");
    };
  }, []);
  return null;
}
