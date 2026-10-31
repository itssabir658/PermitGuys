"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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
 * The top row (logo, main links with rolling labels, Contact) and the menu
 * button come in one after another as the preloader opens: from 0.9s on
 * the homepage, where the iris and the name go first, from 0.3s elsewhere
 * (data-entrance, fixed at the first render).
 *
 * On screens 768px and wider, once the page has scrolled past 80px the row
 * steps up and out from the right, Contact first (0.28s each, 30ms apart),
 * and the menu button rises into the corner once Contact has gone; above
 * 80px the button drops away first and the row comes back from the left.
 * On phones the row stays, with the menu button always shown, on a bar of
 * its own once the page has scrolled (over the homepage's picture, a
 * shade that fades into it rather than a slab across it).
 *
 * The header reads the ground beneath it at the lower half of the button
 * (64px down): ivory type over the hero, the night ground, dark sections
 * and the footer, ink elsewhere. A dark section counts only until the next
 * section begins, so a sheet sliding over it turns the header at once.
 * Every part of it changes tone together, over 0.3s; the two logos share
 * one cell and crossfade.
 *
 * The logo stays in its corner all the way down every page: when the row
 * steps away on wide screens it keeps its place, on a small frosted plate
 * of the ground's own colour, so it reads over pictures and type.
 *
 * Services opens a dropdown of every service page: on hover, or from the
 * small arrow beside it (a click, a tap or Enter), which keyboard users tab
 * to. It closes on leaving it, Escape, a click outside, focus moving on, the
 * row stepping away and navigation. Phones, which have no row, fold the same
 * list out under Services in the menu.
 *
 * The row is held open only while someone is tabbing through it; a mouse
 * click leaves no hold, so the row still collapses on the next page.
 *
 * The menu unfolds from the button itself: its panel grows from the
 * button's outline to full size (0.42s), then the links rise in one after
 * another, over a light scrim on the page. Closing runs the same
 * animations back (the links leave quickly, then the panel folds into the
 * button), so a second click mid-way simply turns them around. It closes on
 * Escape, on a click outside, on navigation and on a link to the page
 * already showing (the "pg:close-menu" event), traps focus while open and
 * is inert while closed.
 */

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

/** The panel grows from the button over this long; the links rise from 0.15s, 30ms apart. */
const FOLD_MS = 420;
const ITEM_AT = 150;
const ITEM_STEP = 30;
const ITEM_MS = 500;
/** Closing runs the opening back: the links this much faster (all together, about 0.17s), the panel this much faster once they have gone. */
const ITEMS_BACK = 3;
const FOLD_BACK = 1.35;
/** In the panel's own time: how long it holds still at the start of a close while the links leave (about 0.16s). */
const FOLD_HOLD_MS = 216;
/** The dropdown waits this long after the pointer leaves, so a path across the gap to it does not close it. */
const DROP_LEAVE_MS = 160;

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
  // Which entrance the header plays on a full load; it plays only once, so later navigations do not matter.
  const [entrance] = useState(pathname === "/" ? "home" : "page");
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const baseId = useId();
  const [drop, setDrop] = useState(false);
  const [sub, setSub] = useState(false);
  const dropRef = useRef<HTMLLIElement>(null);
  const dropBtnRef = useRef<HTMLButtonElement>(null);
  const dropTimer = useRef<number | undefined>(undefined);
  // Opened by the pointer resting on it: a click on the arrow then keeps it open rather than closing it.
  const dropByHover = useRef(false);

  // Close the menu, the dropdown and the menu's services after navigating (adjusting state during render, per React guidance).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setDrop(false);
    setSub(false);
  }

  // Tone and the 80px collapse, as part of the frame loop (after the page modules).
  useEffect(() => {
    const header = headerRef.current;
    const bar = header?.querySelector<HTMLElement>(".site-nav__bar");
    if (!header || !bar) return;
    let darkRanges: Range[] = [];
    let hero: Range | null = null;
    let tone = header.dataset.tone;
    let collapsed = false;
    let overHero = false;
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
        // A section ends where the next one starts, even if that one slides up over it.
        const clamped = (el: HTMLElement) => {
          const r = measureRange(el);
          const next = el.nextElementSibling;
          if (next instanceof HTMLElement && next.offsetParent) {
            const top = measureRange(next).top;
            if (top > r.top) r.height = Math.min(r.height, top - r.top);
          }
          return r;
        };
        darkRanges = [...document.querySelectorAll<HTMLElement>("[data-tone='dark']")].filter((el) => !header.contains(el)).map(clamped);
        const heroEl = document.querySelector<HTMLElement>("[data-home-hero]");
        hero = heroEl ? clamped(heroEl) : null;
      },
      update(f) {
        // The lower half of the button (26–70px from the top).
        const y = f.scroll + 64;
        const dark = document.documentElement.dataset.ground === "night" || darkRanges.some((r) => y >= r.top && y < r.top + r.height);
        const next = dark ? "dark" : "light";
        if (next !== tone) header.dataset.tone = tone = next;
        // Over the homepage's picture the phone bar is a shade, not a slab (globals.css).
        const isOverHero = hero !== null && y >= hero.top && y < hero.top + hero.height;
        if (isOverHero !== overHero) {
          overHero = isOverHero;
          if (overHero) header.dataset.overHero = "";
          else delete header.dataset.overHero;
        }
        const isCollapsed = f.scroll > 80 && !kbdInBar;
        if (isCollapsed !== collapsed) {
          collapsed = isCollapsed;
          if (collapsed) {
            header.dataset.collapsed = "";
            // The dropdown leaves with the row.
            setDrop(false);
          } else delete header.dataset.collapsed;
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

  // A link to the page already showing closes the menu (ScreenTransition): focus goes back to the button for the keyboard, nowhere for a pointer.
  useEffect(() => {
    const onClose = (e: Event) => {
      if (!openRef.current) return;
      if (e instanceof CustomEvent && (e.detail as { keyboard?: boolean } | null)?.keyboard) close();
      else setOpen(false);
    };
    window.addEventListener("pg:close-menu", onClose);
    return () => window.removeEventListener("pg:close-menu", onClose);
  }, [close]);

  // Unfold and fold the panel from the button's outline. One animation per piece, made on the first open and run forwards
  // or backwards after that, so a toggle mid-way turns it around from wherever it is instead of starting again.
  const anims = useRef<{ bg: Animation; items: Animation[] } | null>(null);
  useEffect(() => {
    openRef.current = open;
    const panel = panelRef.current;
    const bg = bgRef.current;
    const button = buttonRef.current;
    if (!panel || !bg || !button) return;
    const reduced = matchMedia(REDUCED).matches;

    if (open) engine.lock("menu");
    else engine.unlock("menu");
    if (open) {
      const focus = requestAnimationFrame(() => panel.querySelector<HTMLElement>("a")?.focus({ preventScroll: true }));
      if (!reduced) {
        if (!anims.current) {
          const b = button.getBoundingClientRect();
          const p = panel.getBoundingClientRect();
          const from = `translate(${b.left - p.left}px, ${b.top - p.top}px) scale(${b.width / p.width}, ${b.height / p.height})`;
          const items = [...panel.querySelectorAll<HTMLElement>("[data-menu-item]")].filter((el) => el.getClientRects().length > 0);
          anims.current = {
            // Opaque all the way but the last stretch into the button, so the fold never shows a see-through grey box.
            bg: bg.animate([{ transform: from, opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: "none", opacity: 1 }], { duration: FOLD_MS, endDelay: FOLD_HOLD_MS, easing: cssEase.power2InOut, fill: "both" }),
            items: items.map((el, i) =>
              el.animate([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: ITEM_MS, delay: ITEM_AT + i * ITEM_STEP, easing: cssEase.power2Out, fill: "both" }),
            ),
          };
        }
        const { bg: fold, items } = anims.current;
        fold.playbackRate = 1;
        fold.play();
        items.forEach((a) => {
          a.playbackRate = 1;
          a.play();
        });
      }
      return () => cancelAnimationFrame(focus);
    }

    if (!shown) return;
    const set = anims.current;
    if (reduced || !set) {
      const hide = requestAnimationFrame(() => setShown(false));
      return () => cancelAnimationFrame(hide);
    }
    set.items.forEach((a) => {
      a.playbackRate = -ITEMS_BACK;
      a.play();
    });
    set.bg.playbackRate = -FOLD_BACK;
    set.bg.play();
    let live = true;
    set.bg.finished
      .catch(() => undefined)
      .then(() => {
        if (live && !openRef.current) setShown(false);
      });
    return () => {
      live = false;
    };
    // `shown` is read, not watched: folding starts only when `open` turns false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The fold starts from the button's outline: a resize while closed moves it, so the animations are made again on the next open.
  useEffect(() => {
    const forget = () => {
      if (openRef.current || !anims.current || (panelRef.current && "shown" in panelRef.current.dataset)) return;
      anims.current.bg.cancel();
      anims.current.items.forEach((a) => a.cancel());
      anims.current = null;
    };
    window.addEventListener("resize", forget, { passive: true });
    return () => window.removeEventListener("resize", forget);
  }, []);

  // On a short screen the menu's content scrolls inside the panel: while there is more of it below, its foot fades out as
  // well as its top (globals.css), so the last line showing reads as more to come rather than as cut off.
  useEffect(() => {
    const content = contentRef.current;
    if (!shown || !content) return;
    const check = () => {
      // From the layout, not scrollHeight, which counts the call to action still risen below its place as the menu opens.
      const end = Math.max(0, ...[...content.children].map((el) => (el instanceof HTMLElement ? el.offsetTop + el.offsetHeight : 0))) + parseFloat(getComputedStyle(content).paddingBottom);
      const more = content.scrollTop + content.clientHeight < end - 1;
      if (more !== "more" in content.dataset) {
        if (more) content.dataset.more = "";
        else delete content.dataset.more;
      }
    };
    check();
    content.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    // The services folding out (or back) under Services changes the height without a scroll or a resize.
    const fold = new ResizeObserver(check);
    if (content.firstElementChild) fold.observe(content.firstElementChild);
    return () => {
      content.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      fold.disconnect();
    };
  }, [shown]);

  // Escape, focus trap and a click outside, while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        // Only what is on screen: phones leave out the services list.
        const focusable = [buttonRef.current, ...panelRef.current.querySelectorAll<HTMLElement>("a, button")].filter((el): el is HTMLElement => el !== null && el.getClientRects().length > 0 && !el.closest("[inert]"));
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
    // Outside the panel, or on the scrim around it (the panel's own ::before).
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (t === panelRef.current || (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t))) setOpen(false);
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
      setDrop(false);
    }
  };

  // The services dropdown: the pointer opens it and, after a moment away, closes it; a click outside closes it too.
  const dropEnter = (e: ReactPointerEvent) => {
    if (e.pointerType === "touch") return;
    window.clearTimeout(dropTimer.current);
    if (!drop) dropByHover.current = true;
    setDrop(true);
  };
  const dropLeave = (e: ReactPointerEvent) => {
    if (e.pointerType === "touch") return;
    window.clearTimeout(dropTimer.current);
    dropTimer.current = window.setTimeout(() => {
      // Keyboard focus inside keeps it open.
      if (!dropRef.current?.querySelector(":focus-visible")) setDrop(false);
    }, DROP_LEAVE_MS);
  };
  const dropToggle = () => {
    window.clearTimeout(dropTimer.current);
    if (drop && dropByHover.current) dropByHover.current = false;
    else {
      dropByHover.current = false;
      setDrop(!drop);
    }
  };
  useEffect(() => () => window.clearTimeout(dropTimer.current), []);
  useEffect(() => {
    if (!drop) return;
    const onPointer = (e: PointerEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDrop(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [drop]);

  return (
    <>
      <header ref={headerRef} data-tone={pathname === "/" ? "dark" : "light"} data-entrance={entrance} data-open={open ? "" : undefined} className="site-nav">
        <div className="site-nav__bar mx-auto flex h-20 w-full max-w-site items-center justify-between gap-6 px-5 sm:px-8 lg:h-24 lg:px-12 xl:px-16">
          <div className="site-nav__item site-nav__item--logo" style={{ "--i": 0, "--o": inline.length + 1 } as CSSProperties}>
            <Link href="/" className="nav-intro site-nav__logo-stack" aria-label={`${site.name} home`}>
              <Logo className="site-nav__logo site-nav__logo--dark h-[1.35rem] w-auto sm:h-6" />
              <Logo onDark className="site-nav__logo site-nav__logo--light h-[1.35rem] w-auto sm:h-6" />
            </Link>
          </div>

          <div className="hidden items-center gap-10 md:flex">
            <nav aria-label="Main">
              <ul className="flex items-center gap-8 text-[0.9375rem] lg:gap-10">
                {inline.map((link, i) => {
                  const active = isActive(pathname, link.href);
                  const item = (
                    <Link href={link.href} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-2 py-2", !link.services && "nav-intro")}>
                      <span aria-hidden="true" className={cn("size-1 rounded-full bg-brand-400 transition-opacity duration-500", active ? "opacity-100" : "opacity-0")} />
                      <RollText>{link.label}</RollText>
                    </Link>
                  );
                  const style = { "--i": i + 1, "--o": inline.length - i } as CSSProperties;
                  if (!link.services) {
                    return (
                      <li key={link.href} className="site-nav__item" style={style}>
                        {item}
                      </li>
                    );
                  }
                  return (
                    <li
                      key={link.href}
                      ref={dropRef}
                      className="site-nav__item site-drop"
                      style={style}
                      data-open={drop ? "" : undefined}
                      onPointerEnter={dropEnter}
                      onPointerLeave={dropLeave}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && drop) {
                          setDrop(false);
                          dropBtnRef.current?.focus();
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrop(false);
                      }}
                    >
                      <div className="nav-intro flex items-center gap-1">
                        {item}
                        <button
                          ref={dropBtnRef}
                          type="button"
                          aria-expanded={drop}
                          aria-controls={`${baseId}-services`}
                          onClick={dropToggle}
                          className="site-drop__toggle"
                        >
                          <span className="sr-only">{drop ? "Hide the services list" : "Show the services list"}</span>
                          <svg aria-hidden="true" viewBox="0 0 10 6" className="site-drop__chevron">
                            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                        </button>
                      </div>
                      <div id={`${baseId}-services`} className="site-drop__panel" inert={!drop}>
                        <div className="site-drop__sheet">
                          <ul className="site-drop__list">
                            {services.map((s, j) => (
                              <li key={s.href} style={{ "--j": j } as CSSProperties}>
                                <Link href={s.href} aria-current={pathname === s.href ? "page" : undefined} className="site-drop__link">
                                  <span aria-hidden="true" className="site-drop__dot" />
                                  {s.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <Link href={link.href} className="site-drop__all">
                            <span className="link-draw">All services</span>
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="site-nav__item" style={{ "--i": inline.length + 1, "--o": 0 } as CSSProperties}>
              <div className="nav-intro">
                <LinkButton href={ctaHref} className="site-nav__cta">
                  Contact
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        <div className="site-nav__menu-slot">
          <span className="nav-intro block" style={{ "--i": inline.length + 2 } as CSSProperties}>
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
          </span>
        </div>
      </header>

      <div
        ref={panelRef}
        id={`${baseId}-menu`}
        data-shown={shown ? "" : undefined}
        data-open={open ? "" : undefined}
        inert={!open}
        aria-hidden={!open}
        data-lenis-prevent=""
        className="site-menu"
      >
        <div ref={bgRef} aria-hidden="true" className="site-menu__bg" />
        <div ref={contentRef} className="site-menu__content">
          <nav aria-label="Site menu">
            <ul className="space-y-0.5">
              {menu.map((link) => (
                <li key={link.href}>
                  {/* The mask the link rises in; it lets 4px past its edge, where the link's focus ring is drawn. */}
                  <span className="flex items-center gap-2 overflow-clip" style={{ overflowClipMargin: 4 }}>
                    <Link
                      href={link.href}
                      data-menu-item=""
                      aria-current={isActive(pathname, link.href) && (link.href !== "/" || pathname === "/") ? "page" : undefined}
                      className="group flex items-baseline gap-4 py-1 outline-offset-1"
                    >
                      <span className="font-display text-[clamp(1.9rem,1.3rem+1.9vw,2.85rem)] leading-[1.08] font-light tracking-[-0.04em] text-ivory/90 group-hover:text-ivory group-focus-visible:text-ivory group-aria-[current=page]:text-ivory">
                        <RollText>{link.label}</RollText>
                      </span>
                      <span aria-hidden="true" className="size-1.5 self-center rounded-full bg-brand-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-[current=page]:opacity-100" />
                    </Link>
                    {link.services ? (
                      // Phones only: wider screens list the services beside the links.
                      <button
                        type="button"
                        data-menu-item=""
                        aria-expanded={sub}
                        aria-controls={`${baseId}-menu-services`}
                        onClick={() => setSub(!sub)}
                        className="site-menu__more hidden"
                      >
                        <span className="sr-only">{sub ? "Hide the services list" : "Show the services list"}</span>
                        <span aria-hidden="true" className="site-menu__plus" />
                      </button>
                    ) : null}
                  </span>
                  {link.services ? (
                    <div id={`${baseId}-menu-services`} data-open={sub ? "" : undefined} inert={!sub} className="site-menu__sub md:hidden">
                      <div className="site-menu__sub-clip">
                        <ul>
                          {services.map((s) => (
                            <li key={s.href}>
                              <Link href={s.href} aria-current={pathname === s.href ? "page" : undefined} className="site-menu__sub-link">
                                {s.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
          <div data-menu-item="" className="site-menu__aside grid content-between gap-10">
            {/* Phones leave the services out (the footer and the Services page list them), so the call to action fits. */}
            <div className="hidden md:block">
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
              <p className="site-menu__blurb max-w-xs text-[0.9375rem] leading-relaxed text-charcoal-300">Architecture, engineering and permit drawings for homeowners, landlords and businesses across the {site.region}.</p>
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
