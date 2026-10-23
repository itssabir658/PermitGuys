import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

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
 * A fat-face serif used once, for the oversized wordmark across the
 * homepage hero (after the Studio Foundry reference). Only the black
 * weight is loaded, and only for the letters it sets.
 */
export const wordmarkFont = Playfair_Display({
  variable: "--font-wordmark-face",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

/** Body copy uses the same Geist family as the headings. */
export const bodyFont = headingFont;
