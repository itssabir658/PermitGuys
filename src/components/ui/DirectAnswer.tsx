import type { ReactNode } from "react";

/**
 * The short, quotable answer that opens service and guide pages. Kept in
 * plain HTML near the top so search and answer engines can lift it cleanly.
 */
export function DirectAnswer({ children, label = "Short answer" }: { children: ReactNode; label?: string }) {
  return (
    <div className="border-l-2 border-copper-500 bg-paper-100 px-6 py-5 sm:px-8 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-700">{label}</p>
      <p className="mt-3 text-lg leading-relaxed text-navy-900 text-pretty">{children}</p>
    </div>
  );
}
