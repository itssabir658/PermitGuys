"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { ATTRIBUTION_STORAGE_KEY, nextAttribution, sanitizeAttribution } from "@/lib/inquiry/attribution";

/**
 * Renders nothing. On page load it remembers campaign attribution for the
 * session (read by the inquiry form), and it reports clicks on phone and
 * email links. Both are no-ops for analytics until a tag manager is
 * installed (see lib/analytics).
 */
export function SiteTelemetry() {
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      const next = nextAttribution(new URL(window.location.href), document.referrer, stored ? sanitizeAttribution(stored) : null);
      if (next) sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private browsing, blocked cookies). Attribution is optional.
    }

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) track("click_to_call", { link_location: link?.getAttribute("data-track-location") ?? undefined });
      else if (href.startsWith("mailto:")) track("click_to_email", { link_location: link?.getAttribute("data-track-location") ?? undefined });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
