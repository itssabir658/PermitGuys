"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { NavLink } from "@/content/navigation";
import { site } from "@/content/site";
import { LinkButton } from "@/components/ui/LinkButton";
import { RollText } from "@/components/ui/RollText";
import { cn } from "@/components/ui/cn";
import { ORDER, engine, measureRange, type Range } from "@/lib/motion/engine";
import { cssEase } from "@/lib/motion/math";
import { Logo } from "./Logo";

/*
 * Header and menu, after the reference's navigation (docs/MOTION.md,
 * "Navigation").
 *
 * The top row (logo, main links with rolling labels, Contact) fades in 1.6s
 * after the preloader lifts. On screens 768px and wider, once the page has
 * scrolled past 80px the row steps up and out, one item after another, and
 * the menu button rises into the corner; above 80px it all comes back. On
 * phones the row stays, with the menu button always shown.
 *
 * The header reads the ground beneath it at the lower half of the button
 * (64px down): ivory type over the hero, the night ground, dark sections
 * and the footer, ink elsewhere. A dark section counts only until the next
 * section begins, so a sheet sliding over it turns the header at once.
 *
 * The row is held open only while someone is tabbing through it; a mouse
 * click leaves no hold, so the row still collapses on the next page.
 *
 * The menu unfolds from the button itself: its panel grows from the
 * button's outline to full size (0.5s), then the links rise in one after
 * another. It closes on Escape, on a click outside and on navigation, traps
 * focus while open and is inert while closed.
 */

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

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
  const [shown, setShown] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Close the menu after navigating (adjusting state during render, per React guidance).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Tone and the 80px collapse, as part of the frame loop (after the page modules).
  useEffect(() => {
    const header = headerRef.current;
    const bar = header?.querySelector<HTMLElement>(".site-nav__bar");
    if (!header || !bar) return;
    let darkRanges: Range[] = [];
    let tone = header.dataset.tone;
    let collapsed = false;
    // Keyboard focus in the row holds it open; mouse focus (a clicked link) does not.
    let kbdInBar = false;
    const fin = (e: FocusEvent) => {
      kbdInBar = e.target instanceof Element && e.target.matches(":focus-visible");
    };
    const fout = () => {
      kbdInBar = false;
    };
    bar.addEventListener("focusin", fin);
    bar.addEventListener("focusout", fout);
    return engine.register({
      order: ORDER.nav,
      measure() {
        darkRanges = [...document.querySelectorAll<HTMLElement>("[data-tone='dark']")]
          .filter((el) => !header.contains(el))
          .map((el) => {
            const r = measureRange(el);
            // A dark section ends where the next one starts, even if that one slides up over it.
            const next = el.nextElementSibling;
            if (next instanceof HTMLElement && next.offsetParent) {
              const top = measureRange(next).top;
              if (top > r.top) r.height = Math.min(r.height, top - r.top);
            }
            return r;
          });
      },
      update(f) {
        // The lower half of the button (26–70px from the top).
        const y = f.scroll + 64;
        const dark = document.documentElement.dataset.ground === "night" || darkRanges.some((r) => y >= r.top && y < r.top + r.height);
        const next = dark ? "dark" : "light";
        if (next !== tone) header.dataset.tone = tone = next;
        const isCollapsed = f.scroll > 80 && !kbdInBar;
        if (isCollapsed !== collapsed) {
          collapsed = isCollapsed;
          if (collapsed) header.dataset.collapsed = "";
          else delete header.dataset.collapsed;
        }
      },
      destroy() {
        bar.removeEventListener("focusin", fin);
        bar.removeEventListener("focusout", fout);
      },
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Unfold and fold the panel from the button's outline.
  useEffect(() => {
    const panel = panelRef.current;
    const bg = bgRef.current;
    const button = buttonRef.current;
    if (!panel || !bg || !button) return;
    const reduced = matchMedia(REDUCED).matches;
    const items = [...panel.querySelectorAll<HTMLElement>("[data-menu-item]")];
    const fromButton = () => {
      const b = button.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      return `translate(${b.left - p.left}px, ${b.top - p.top}px) scale(${b.width / p.width}, ${b.height / p.height})`;
    };
    const cancelAll = () => [bg, ...items].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

    if (open) {
      engine.lock("menu");
      cancelAll();
      if (!reduced) {
        bg.animate([{ transform: fromButton() }, { transform: "none" }], { duration: 500, easing: cssEase.power3Out, fill: "both" });
        items.forEach((el, i) =>
          el.animate([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, delay: 150 + i * 30, easing: cssEase.power2Out, fill: "both" }),
        );
      }
      const focus = requestAnimationFrame(() => panel.querySelector<HTMLElement>("a")?.focus({ preventScroll: true }));
      return () => cancelAnimationFrame(focus);
    }

    engine.unlock("menu");
    if (!shown) return;
    if (reduced) {
      const hide = requestAnimationFrame(() => setShown(false));
      return () => cancelAnimationFrame(hide);
    }
    items.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: cssEase.power2Out, fill: "forwards" }));
    const fold = bg.animate([{ transform: "none", opacity: 1 }, { transform: fromButton(), opacity: 0 }], { duration: 450, easing: cssEase.power3Out, fill: "forwards" });
    let live = true;
    fold.finished
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setShown(false);
        cancelAll();
      });
    return () => {
      live = false;
    };
    // `shown` is read, not watched: folding starts only when `open` turns false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape, focus trap and a click outside, while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = [buttonRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a, button")].filter((el): el is HTMLElement => Boolean(el));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  const toggle = () => {
    if (open) close();
    else {
      setShown(true);
      setOpen(true);
    }
  };

  return (
    <>
      <header ref={headerRef} data-tone={pathname === "/" ? "dark" : "light"} data-open={open ? "" : undefined} className="site-nav">
        <div className="site-nav__bar mx-auto flex h-20 w-full max-w-site items-center justify-between gap-6 px-5 sm:px-8 lg:h-24 lg:px-12 xl:px-16">
          <div className="site-nav__item site-nav__item--logo" style={{ "--i": 0 } as CSSProperties}>
            <Link href="/" className="nav-intro relative block" aria-label={`${site.name} home`}>
              <Logo onDark priority className="site-nav__logo site-nav__logo--light h-[1.35rem] w-auto sm:h-6" />
              <Logo priority className="site-nav__logo site-nav__logo--dark h-[1.35rem] w-auto sm:h-6" />
            </Link>
          </div>

          <div className="hidden items-center gap-10 md:flex">
            <nav aria-label="Main">
              <ul className="flex items-center gap-8 text-[0.9375rem] lg:gap-10">
                {inline.map((link, i) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href} className="site-nav__item" style={{ "--i": i + 1 } as CSSProperties}>
                      <Link href={link.href} aria-current={active ? "page" : undefined} className="nav-intro group relative flex items-center gap-2 py-2">
                        <span aria-hidden="true" className={cn("size-1 rounded-full bg-brand-400 transition-opacity duration-500", active ? "opacity-100" : "opacity-0")} />
                        <RollText>{link.label}</RollText>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="site-nav__item" style={{ "--i": inline.length + 1 } as CSSProperties}>
              <div className="nav-intro">
                <LinkButton href={ctaHref} className="site-nav__cta">
                  Contact
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        <div className="site-nav__menu-slot">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={`${baseId}-menu`}
            onClick={toggle}
            className="site-nav__menu-btn"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="site-nav__icon site-nav__icon--open">
              <span />
              <span />
            </span>
            <span aria-hidden="true" className="site-nav__icon site-nav__icon--close">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div
        ref={panelRef}
        id={`${baseId}-menu`}
        data-shown={shown ? "" : undefined}
        inert={!open}
        aria-hidden={!open}
        data-lenis-prevent=""
        className="site-menu"
      >
        <div ref={bgRef} aria-hidden="true" className="site-menu__bg" />
        <div className="site-menu__content">
          <nav aria-label="Site menu">
            <ol className="space-y-0.5">
              {menu.map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <Link
                    href={link.href}
                    data-menu-item=""
                    aria-current={isActive(pathname, link.href) && (link.href !== "/" || pathname === "/") ? "page" : undefined}
                    className="group flex items-baseline gap-4 py-1"
                  >
                    <span aria-hidden="true" className="w-7 text-label text-charcoal-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-[clamp(1.9rem,1.3rem+1.9vw,2.85rem)] leading-[1.08] font-light tracking-[-0.04em] text-ivory/90 group-hover:text-ivory group-aria-[current=page]:text-ivory">
                      <RollText>{link.label}</RollText>
                    </span>
                    <span aria-hidden="true" className="size-1.5 self-center rounded-full bg-brand-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-aria-[current=page]:opacity-100" />
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div data-menu-item="" className="grid content-between gap-10">
            <div>
              <p className="text-label text-charcoal-300">Services</p>
              <ul className="mt-4 space-y-2 text-[0.9375rem]">
                {services.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="link-draw text-ivory/80 hover:text-ivory">
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              <p className="max-w-xs text-[0.9375rem] leading-relaxed text-charcoal-300">Permit drawings and permit guidance for homeowners, landlords and businesses across the {site.region}.</p>
              <LinkButton href={ctaHref} tone="light">
                Start a project
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
