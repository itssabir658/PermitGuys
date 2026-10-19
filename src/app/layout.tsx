import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteTelemetry } from "@/components/layout/SiteTelemetry";
import { SkipLink } from "@/components/layout/SkipLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { site } from "@/content/site";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  // Until the production URL is configured, keep every page out of search indexes.
  robots: site.indexable
    ? {
        index: true,
        follow: true,
        // Let search and answer engines show full snippets and large image previews.
        googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
      }
    : { index: false, follow: false },
  verification: {
    google: site.verification.google,
    ...(site.verification.bing ? { other: { "msvalidate.01": site.verification.bing } } : {}),
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#14263D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${newsreader.variable} ${instrumentSans.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <SiteTelemetry />
      </body>
    </html>
  );
}
