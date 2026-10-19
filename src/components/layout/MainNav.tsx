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
                    className={cn("relative px-4 py-3 text-[0.95rem] text-navy-900 hover:text-copper-700", active && "after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:bg-copper-500")}
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
                    "relative flex items-center gap-1.5 px-4 py-3 text-[0.95rem] text-navy-900 hover:text-copper-700",
                    active && "after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:bg-copper-500",
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
                  className="absolute top-full left-0 z-50 mt-2 w-[22rem] border border-line bg-paper p-2 shadow-[0_24px_48px_-24px_rgb(20_38_61/0.35)]"
                >
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          aria-current={pathname === link.href ? "page" : undefined}
                          className="block px-4 py-3 hover:bg-paper-100 focus-visible:bg-paper-100"
                        >
                          <span className="block text-[0.95rem] font-medium text-navy-900">{link.label}</span>
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
        className="hidden min-h-11 items-center bg-navy-900 px-5 text-[0.95rem] font-medium text-paper transition-colors hover:bg-navy-800 sm:inline-flex"
      >
        Get Started
      </Link>

      {/* Mobile */}
      <button
        ref={mobileButtonRef}
        type="button"
        className="inline-flex size-11 items-center justify-center text-navy-900 lg:hidden"
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
        className="fixed inset-x-0 top-[4.5rem] bottom-0 z-50 overflow-y-auto border-t border-line bg-paper pt-4 lg:hidden"
      >
        <nav aria-label="Main" className="px-5 pb-12 sm:px-8">
          <ul className="divide-y divide-line border-y border-line">
            {groups.map((group) => (
              <li key={group.label} className="py-5">
                <Link href={group.href} className="font-display text-2xl text-navy-900">
                  {group.label}
                </Link>
                {group.links.length > 1 ? (
                  <ul className="mt-3 space-y-1">
                    {group.links
                      .filter((l) => l.href !== group.href)
                      .map((link) => (
                        <li key={link.href + link.label}>
                          <Link href={link.href} className="block py-1.5 text-ink-muted hover:text-navy-900">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <Link href={ctaHref} className="mt-8 flex min-h-12 items-center justify-between bg-navy-900 px-6 text-paper">
            Get Started
            <ArrowRight />
          </Link>
        </nav>
      </div>
    </div>
  );
}
