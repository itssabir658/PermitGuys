import type { Metadata, Viewport } from "next";
import { headingFont, logoFont, monoFont } from "./fonts";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InteractionEffects } from "@/components/layout/InteractionEffects";
import { MotionRoot } from "@/components/layout/MotionRoot";
import { Preloader, motionScript } from "@/components/layout/Preloader";
import { ScreenTransition } from "@/components/layout/ScreenTransition";
import { SiteTelemetry } from "@/components/layout/SiteTelemetry";
import { SkipLink } from "@/components/layout/SkipLink";
import { JsonLd } from "@/components/ui/JsonLd";
import { NotchClipDefs } from "@/components/ui/NotchClip";
import { site } from "@/content/site";
import { chatConfigured } from "@/lib/chat/config";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import "./globals.css";

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
  themeColor: "#F4F1EB",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${headingFont.variable} ${monoFont.variable} ${logoFont.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Before first paint: turn on the preloader and scroll motion for visitors who allow motion. */}
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* First in the body, so it is in place before any content paints. */}
        <Preloader />
        <SkipLink />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter />
        {/* The notched drawing-sheet outline for framed pictures on any page (.notch-clip). */}
        <NotchClipDefs />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <SiteTelemetry />
        <InteractionEffects />
        <MotionRoot />
        <ScreenTransition />
        {/* The website assistant, on only when ANTHROPIC_API_KEY is set (docs/CHAT.md). */}
        {chatConfigured(process.env) ? <ChatAssistant /> : null}
      </body>
    </html>
  );
}
