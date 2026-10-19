import type { NextConfig } from "next";

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
