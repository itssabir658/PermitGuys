import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/** Shared Open Graph and Twitter image: 1200 × 630 PNG in the brand colours. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

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
          background: "#14263D",
          color: "#F7F6F2",
          backgroundImage:
            "linear-gradient(rgba(247,246,242,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(247,246,242,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 40, height: 40, border: "3px solid #C77A45", background: "#C77A45" }} />
          <div style={{ fontSize: 40, letterSpacing: -0.5 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, textTransform: "uppercase", letterSpacing: 4, color: "#E2A87F" }}>{eyebrow}</div>
          <div style={{ marginTop: 24, fontSize: title.length > 60 ? 54 : 64, lineHeight: 1.12, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", borderTop: "2px solid #C77A45", paddingTop: 24, fontSize: 24, color: "rgba(247,246,242,0.8)" }}>
          Permit drawings and permit guidance · {site.region}
        </div>
      </div>
    ),
    ogSize,
  );
}
