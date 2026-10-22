import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/** Shared Open Graph and Twitter image: 1200 × 630 PNG in the site palette: graphite ground, ivory type, a single red rule. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/permitguys-logo-on-dark.png")).toString("base64")}`;

export function ogImage({ eyebrow, title }: { eyebrow: string; title: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#111110",
          color: "#F4F1EB",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img elements. */}
        <img src={logo} alt={site.name} width={327} height={61} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, textTransform: "uppercase", letterSpacing: 4, color: "#A9A49B" }}>{eyebrow}</div>
          <div style={{ marginTop: 28, fontSize: title.length > 60 ? 58 : 72, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1000, fontWeight: 300 }}>{title}</div>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid rgba(244,241,235,0.2)", paddingTop: 24, fontSize: 22, color: "rgba(244,241,235,0.7)", alignItems: "center", gap: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#EE352F" }} />
          Permit drawings and permit guidance · {site.region}
        </div>
      </div>
    ),
    ogSize,
  );
}
