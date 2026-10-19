"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavGroup } from "@/content/navigation";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";

/*
 * Primary navigation. Desktop uses disclosure menus (button + list of links,
 * not ARIA menus, which suit app toolbars rather than site navigation).
 * Mobile uses a full-height panel that traps focus while open.
 * Both close on Escape, on outside click and on route change.
 */

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MainNav({ groups, ctaHref }: { groups: NavGroup[]; ctaHref: Route }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Close everything after navigating (adjusting state during render, per React guidance).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    mobileButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const trigger = document.getElementById(`${baseId}-${openMenu}-trigger`);
        setOpenMenu(null);
        trigger?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu, baseId]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = [
          mobileButtonRef.current,
          ...panelRef.current.querySelectorAll<HTMLElement>("a, button"),
        ].filter((el): el is HTMLElement => Boolean(el));
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
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, closeMobile]);

  const menuId = (label: string) => `${baseId}-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div ref={navRef} className="flex items-center gap-2">
      {/* Desktop */}
      <nav aria-label="Main" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {groups.map((group) => {
            const key = group.label.replace(/\s+/g, "-").toLowerCase();
            const active = isActive(pathname, group.href);
            if (group.links.length <= 1) {
              return (
                <li key={group.label}>
                  <Link
                    href={group.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("relative block rounded-xl px-3.5 py-2.5 text-[0.95rem] text-charcoal-700 transition-colors hover:bg-charcoal-900/[0.05] hover:text-charcoal-900 xl:px-4", active && "bg-charcoal-900/[0.06] text-charcoal-900")}
                  >
                    {group.label}
                  </Link>
                </li>
              );
            }
            const open = openMenu === key;
            return (
              <li key={group.label} className="relative">
                <button
                  type="button"
                  id={`${baseId}-${key}-trigger`}
                  aria-expanded={open}
                  aria-controls={menuId(group.label)}
                  onClick={() => setOpenMenu(open ? null : key)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[0.95rem] text-charcoal-700 transition-colors hover:bg-charcoal-900/[0.05] hover:text-charcoal-900 xl:px-4",
                    (active || open) && "bg-charcoal-900/[0.06] text-charcoal-900",
                  )}
                >
                  {group.label}
                  <svg viewBox="0 0 12 12" aria-hidden="true" className={cn("size-2.5 transition-transform duration-200", open && "rotate-180")}>
                    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.5} />
                  </svg>
                </button>
                <div
                  id={menuId(group.label)}
                  hidden={!open}
                  className="absolute top-full left-0 z-50 mt-3 w-[23rem] rounded-2xl border border-white bg-white/90 p-2 shadow-[0_30px_60px_-30px_rgb(28_28_28/0.45)] ring-1 ring-charcoal-900/[0.06] backdrop-blur-xl"
                >
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          aria-current={pathname === link.href ? "page" : undefined}
                          className="block rounded-xl px-4 py-3 transition-colors hover:bg-paper focus-visible:bg-paper"
                        >
                          <span className="block text-[0.95rem] font-medium text-charcoal-900">{link.label}</span>
                          {link.description ? <span className="mt-0.5 block text-sm leading-snug text-ink-muted line-clamp-2">{link.description}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href={ctaHref}
        className="hidden min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-600 sm:inline-flex"
      >
        Discuss your project
      </Link>

      {/* Mobile */}
      <button
        ref={mobileButtonRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-xl text-charcoal-900 hover:bg-charcoal-900/[0.05] lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls={`${baseId}-mobile`}
        onClick={() => (mobileOpen ? closeMobile() : setMobileOpen(true))}
      >
        <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" className="relative block h-3 w-6">
          <span className={cn("absolute left-0 block h-px w-6 bg-current transition-transform duration-300", mobileOpen ? "top-1.5 rotate-45" : "top-0")} />
          <span className={cn("absolute left-0 block h-px w-6 bg-current transition-transform duration-300", mobileOpen ? "top-1.5 -rotate-45" : "top-3")} />
        </span>
      </button>

      <div
        ref={panelRef}
        id={`${baseId}-mobile`}
        hidden={!mobileOpen}
        className="fixed inset-x-3 top-[5.25rem] bottom-3 z-50 overflow-y-auto rounded-2xl border border-white bg-white/95 pt-2 shadow-[0_30px_60px_-30px_rgb(28_28_28/0.45)] ring-1 ring-charcoal-900/[0.06] backdrop-blur-xl sm:inset-x-4 lg:hidden"
      >
        <nav aria-label="Main" className="px-5 pb-8 sm:px-8">
          <ul className="divide-y divide-charcoal-900/10">
            {groups.map((group) => (
              <li key={group.label} className="py-5">
                <Link href={group.href} className="font-display text-2xl text-charcoal-900">
                  {group.label}
                </Link>
                {group.links.length > 1 ? (
                  <ul className="mt-3 space-y-1">
                    {group.links
                      .filter((l) => l.href !== group.href)
                      .map((link) => (
                        <li key={link.href + link.label}>
                          <Link href={link.href} className="block py-1.5 text-ink-muted hover:text-charcoal-900">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <Link href={ctaHref} className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-brand-500 px-6 font-semibold text-white">
            Discuss your project
            <ArrowRight />
          </Link>
        </nav>
      </div>
    </div>
  );
}
