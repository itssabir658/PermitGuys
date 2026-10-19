import type { NextConfig } from "next";
import { legacyRedirects } from "./src/content/redirects";

/*
 * Security headers that cannot break page rendering. A full script
 * Content-Security-Policy is left out because Next.js inline bootstrap
 * scripts and JSON-LD would need per-request nonces, which would make every
 * page dynamic; see docs/AUDIT.md.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Cache Components is deliberately left off: every page is static content
// generated from typed files in src/content, and some collections (projects,
// service areas) start empty, which Cache Components rejects in
// generateStaticParams. Revisit if request-time data is introduced.
const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return legacyRedirects.map((r) => ({ ...r, permanent: true }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
