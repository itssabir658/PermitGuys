"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavLink } from "@/content/navigation";
import { site } from "@/content/site";
import { cn } from "@/components/ui/cn";
import { Logo } from "./Logo";

/*
 * Header bar and full-screen menu.
 *
 * The bar is transparent with ivory type over the homepage photograph and
 * settles onto ivory once the page scrolls. It slides away while the visitor
 * reads downwards and returns as soon as they scroll back up.
 *
 * The menu is a full-screen graphite panel that unveils from the top, with
 * its links rising in sequence. It traps focus while open and closes on
 * Escape and on navigation. When closed it is inert and hidden from
 * assistive technology.
 */

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MainNav({
  inline,
  menu,
  services,
  ctaHref,
}: {
  inline: NavLink[];
  menu: NavLink[];
  services: { label: string; href: Route }[];
  ctaHref: Route;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [overHero, setOverHero] = useState(pathname === "/");
  const [lastPath, setLastPath] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Close the menu after navigating (adjusting state during render, per React guidance).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setOverHero(pathname === "/");
  }

  useEffect(() => {
    // From the first in-site link click on, pages arrive with the gentle page transition.
    // The first page of a visit never waits on it.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href^='/']");
      if (link) document.documentElement.dataset.navigated = "";
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      setOverHero(pathname === "/" && y < window.innerHeight - 96);
      if (Math.abs(y - lastY) > 6) {
        setTucked(y > lastY && y > 240);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a");
    const focusFrame = requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = [buttonRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a, button")].filter((el): el is HTMLElement => Boolean(el));
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const light = open || overHero;
  const solid = scrolled && !overHero && !open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,box-shadow] duration-700 ease-out-expo",
          tucked && !open && "-translate-y-full",
          solid ? "bg-ivory/90 text-ink shadow-[0_1px_0_rgb(23_23_22/0.08)] backdrop-blur-md" : "bg-transparent",
          light ? "text-ivory" : "text-ink",
        )}
      >
        <div className="mx-auto flex h-20 w-full max-w-site items-center justify-between gap-6 px-5 sm:px-8 lg:h-24 lg:px-12 xl:px-16">
          <Link href="/" className="relative z-10 shrink-0" aria-label={`${site.name} home`}>
            <Logo onDark={light} priority className="h-[1.35rem] w-auto sm:h-6" />
          </Link>

          <nav aria-label="Main" className={cn("hidden lg:block", open && "lg:invisible")}>
            <ul className="flex items-center gap-10 text-[0.9375rem]">
              {inline.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link href={link.href} aria-current={active ? "page" : undefined} className="group relative flex items-center gap-2 py-2">
                      <span aria-hidden="true" className={cn("size-1 rounded-full bg-brand-400 transition-opacity duration-500", active ? "opacity-100" : "opacity-0")} />
                      <span className="link-draw">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-2 sm:gap-6">
            <Link
              href={ctaHref}
              className={cn(
                "group hidden min-h-11 items-center gap-3 rounded-full border px-5 text-[0.9375rem] transition-colors duration-500 sm:inline-flex",
                light ? "border-ivory/40 hover:border-ivory hover:bg-ivory hover:text-ink" : "border-ink/25 hover:border-ink hover:bg-ink hover:text-ivory",
                open && "invisible",
              )}
            >
              Start a project
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-400 transition-transform duration-500 group-hover:scale-150" />
            </Link>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={`${baseId}-menu`}
              onClick={() => (open ? close() : setOpen(true))}
              className="group -mr-2 inline-flex min-h-11 items-center gap-3 px-2 text-[0.9375rem]"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true" className="relative hidden h-5 overflow-hidden sm:block">
                <span className={cn("block transition-transform duration-500 ease-out-expo", open && "-translate-y-1/2")}>
                  <span className="block h-5">Menu</span>
                  <span className="block h-5">Close</span>
                </span>
              </span>
              <span aria-hidden="true" className="relative block h-3 w-7">
                <span className={cn("absolute right-0 block h-px bg-current transition-all duration-500 ease-out-expo", open ? "top-1.5 w-7 rotate-[24deg]" : "top-0.5 w-7 group-hover:w-5")} />
                <span className={cn("absolute right-0 block h-px bg-current transition-all duration-500 ease-out-expo", open ? "top-1.5 w-7 -rotate-[24deg]" : "top-2.5 w-5 group-hover:w-7")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        ref={panelRef}
        id={`${baseId}-menu`}
        data-open={open ? "" : undefined}
        inert={!open}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto bg-charcoal-950 text-ivory",
          "duration-[900ms] ease-in-out-quint motion-reduce:transition-none",
          // Visible at once on opening, so focus can move in; hidden only after the panel has closed.
          open ? "visible transition-[clip-path] [clip-path:inset(0_0_0_0)]" : "invisible transition-[clip-path,visibility] [clip-path:inset(0_0_100%_0)]",
        )}
      >
        <div className="mx-auto grid min-h-full w-full max-w-site gap-14 px-5 pt-28 pb-10 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-36 xl:px-16">
          <nav aria-label="Site menu" className="lg:col-span-7">
            <ol className="space-y-1">
              {menu.map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <Link
                    href={link.href}
                    aria-current={isActive(pathname, link.href) && (link.href !== "/" || pathname === "/") ? "page" : undefined}
                    style={{ transitionDelay: open ? `${180 + i * 60}ms` : "0ms" }}
                    className={cn(
                      "group flex items-baseline gap-5 py-1 transition-[transform,opacity] duration-1000 ease-out-expo motion-reduce:transition-none",
                      open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                    )}
                  >
                    <span aria-hidden="true" className="w-8 text-label text-charcoal-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-[clamp(2.25rem,1.2rem+4.2vw,5.25rem)] leading-[1.02] font-light tracking-[-0.045em] text-ivory/90 transition-[color,transform] duration-500 ease-out-expo group-hover:translate-x-3 group-hover:text-ivory group-aria-[current=page]:text-ivory">
                      {link.label}
                    </span>
                    <span aria-hidden="true" className="size-2 self-center rounded-full bg-brand-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-aria-[current=page]:opacity-100" />
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div
            style={{ transitionDelay: open ? "520ms" : "0ms" }}
            className={cn(
              "flex flex-col justify-between gap-12 transition-opacity duration-1000 ease-out-expo motion-reduce:transition-none lg:col-span-4 lg:col-start-9",
              open ? "opacity-100" : "opacity-0",
            )}
          >
            <div>
              <p className="text-label text-charcoal-300">Services</p>
              <ul className="mt-5 space-y-2.5 text-[0.9375rem]">
                {services.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="link-draw text-ivory/80 hover:text-ivory">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <p className="max-w-xs text-[0.9375rem] leading-relaxed text-charcoal-300">Permit drawings and permit guidance for homeowners, landlords and businesses across the {site.region}.</p>
              <Link href={ctaHref} className="group inline-flex items-center gap-4 text-lg">
                <span className="link-rule pb-1">Start a project</span>
                <span aria-hidden="true" className="size-2 rounded-full bg-brand-400 transition-transform duration-500 group-hover:scale-150" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
