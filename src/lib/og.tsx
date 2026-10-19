import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/** Shared Open Graph and Twitter image: 1200 × 630 PNG in the brand colours. */
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
          background: "#1C1C1C",
          color: "#FFFFFF",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img elements. */}
        <img src={logo} alt={site.name} width={327} height={61} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, textTransform: "uppercase", letterSpacing: 4, color: "#F28B82" }}>{eyebrow}</div>
          <div style={{ marginTop: 24, fontSize: title.length > 60 ? 54 : 64, lineHeight: 1.12, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", borderTop: "2px solid #EE352F", paddingTop: 24, fontSize: 24, color: "rgba(255,255,255,0.8)" }}>
          Permit drawings and permit guidance · {site.region}
        </div>
      </div>
    ),
    ogSize,
  );
}
