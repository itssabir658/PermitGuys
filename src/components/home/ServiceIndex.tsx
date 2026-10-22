"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Plate } from "@/content/imagery";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";

export interface ServiceIndexItem {
  href: Route;
  title: string;
  summary: string;
  category: string;
  plate: Plate;
}

/*
 * Numbered service index. On large screens with a fine pointer, hovering a
 * row dims the others and a study image follows the cursor, easing toward
 * it rather than sticking to it. Rows are ordinary links, so keyboard,
 * touch and reduced-motion visitors get the same content without the
 * preview; small screens show a thumbnail in each row instead.
 */
export function ServiceIndex({ items }: { items: ServiceIndexItem[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(query.matches && !reduced.matches);
    update();
    query.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (previewRef.current) previewRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX + 32, y: e.clientY - 180 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [enabled]);

  return (
    <div className="relative">
      <ol className="dim-siblings border-b border-line" onPointerLeave={() => setActive(null)}>
        {items.map((item, i) => (
          <li key={item.href} data-reveal="" style={{ "--d": i * 60 } as CSSProperties}>
            <Link
              href={item.href}
              onPointerEnter={(e) => {
                if (active === null) {
                  target.current = { x: e.clientX + 32, y: e.clientY - 180 };
                  pos.current = { ...target.current };
                }
                setActive(i);
              }}
              onFocus={() => setActive(null)}
              className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-t border-line py-7 transition-opacity duration-500 ease-out-expo sm:grid-cols-[4rem_minmax(0,1fr)_auto] lg:grid-cols-12 lg:gap-x-8 lg:py-9"
            >
              <span className="self-start pt-2 text-label text-ink-muted tabular-nums lg:col-span-1 lg:self-center lg:pt-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 lg:col-span-6">
                <span className="block font-display text-[clamp(1.6rem,1rem+2.3vw,3.4rem)] leading-[1.02] font-light tracking-[-0.04em] text-ink transition-transform duration-700 ease-out-expo lg:group-hover:translate-x-4">
                  {item.title}
                </span>
                <span className="mt-3 block max-w-md text-[0.9375rem] leading-relaxed text-ink-muted lg:hidden">{item.summary}</span>
              </span>
              <span className="relative size-18 shrink-0 self-start overflow-hidden bg-stone-300 sm:size-24 lg:hidden">
                <Image src={item.plate.src} alt="" fill sizes="6rem" className="object-cover" style={{ objectPosition: item.plate.focus }} />
              </span>
              <span className="hidden text-label text-ink-muted lg:col-span-1 lg:block">{item.category}</span>
              <span className="hidden max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted lg:col-span-3 lg:block">{item.summary}</span>
              <span aria-hidden="true" className="hidden justify-self-end lg:col-span-1 lg:flex">
                <span className="flex size-12 items-center justify-center rounded-full ring-1 ring-ink/15 transition-colors duration-500 ease-out-expo ring-inset group-hover:bg-ink group-hover:text-ivory group-hover:ring-ink">
                  <ArrowRight className="size-4 -rotate-45 transition-transform duration-500 ease-out-expo group-hover:rotate-0" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {enabled ? (
        <div ref={previewRef} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-30 w-[19rem] xl:w-[22rem]">
          <div
            className={cn(
              "relative aspect-[4/5] overflow-hidden bg-stone-300 shadow-[0_40px_80px_-40px_rgb(17_17_16/0.5)] transition-[opacity,transform,clip-path] duration-700 ease-out-expo",
              active === null ? "scale-90 opacity-0 [clip-path:inset(30%_10%_30%_10%)]" : "scale-100 opacity-100 [clip-path:inset(0_0_0_0)]",
            )}
          >
            {items.map((item, i) => (
              <Image
                key={item.href}
                src={item.plate.src}
                alt=""
                fill
                sizes="22rem"
                className={cn("object-cover transition-[opacity,transform] duration-700 ease-out-expo", active === i ? "scale-100 opacity-100" : "scale-110 opacity-0")}
                style={{ objectPosition: item.plate.focus }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
