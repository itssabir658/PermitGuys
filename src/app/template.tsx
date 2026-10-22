import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation, so each page rises gently out of the
 * ivory ground: a quiet page transition that never blocks navigation and
 * does nothing for visitors who prefer reduced motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
