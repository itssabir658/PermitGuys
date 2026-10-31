import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

/*
 * Typography for the luxury redesign: one superfamily, two voices.
 *
 * Geist carries both the oversized editorial headlines (light and regular
 * weights, tightly tracked) and the body copy. Geist Mono is used only for
 * small uppercase labels and metadata (sheet numbers, project data), the
 * way an architectural drawing set annotates its plates.
 *
 * To switch to licensed brand fonts later, replace these two definitions
 * with next/font/local and keep the variable names.
 */
export const headingFont = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const monoFont = Geist_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * The logo's typeface, for the four Values words (Sebra, 26 October 2026).
 * The logo is set in ITC Avant Garde Gothic, a paid face; until a licensed
 * file arrives this is TeX Gyre Adventor Bold, a free revival of it under
 * the GUST Font License (fonts/GUST-FONT-LICENSE.txt), the weight that
 * matches the logo, subset to Latin. The wordmark itself is drawn from the
 * same outlines (src/content/wordmark.ts).
 */
export const logoFont = localFont({
  src: "./fonts/tex-gyre-adventor-bold-latin.woff2",
  variable: "--font-logo-face",
  weight: "700",
  display: "swap",
});

/** Body copy uses the same Geist family as the headings. */
export const bodyFont = headingFont;
