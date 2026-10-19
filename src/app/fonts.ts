import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

/*
 * Brand typefaces: Lufga for headings, Gilroy for body text.
 *
 * Both are commercial fonts, so they cannot be downloaded from Google Fonts.
 * Until licensed web files are supplied, the site uses the closest open
 * fonts: Outfit stands in for Lufga and Plus Jakarta Sans for Gilroy.
 *
 * To switch to the real fonts, put the licensed .woff2 files in
 * src/app/fonts/ and replace the two definitions below, keeping the
 * variable names (see docs/DESIGN.md):
 *
 *   import localFont from "next/font/local";
 *   export const headingFont = localFont({
 *     variable: "--font-heading",
 *     display: "swap",
 *     src: [
 *       { path: "./fonts/Lufga-Medium.woff2", weight: "500" },
 *       { path: "./fonts/Lufga-SemiBold.woff2", weight: "600" },
 *     ],
 *   });
 *   export const bodyFont = localFont({
 *     variable: "--font-body",
 *     display: "swap",
 *     src: [
 *       { path: "./fonts/Gilroy-Regular.woff2", weight: "400" },
 *       { path: "./fonts/Gilroy-Medium.woff2", weight: "500" },
 *       { path: "./fonts/Gilroy-SemiBold.woff2", weight: "600" },
 *     ],
 *   });
 */
export const headingFont = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
