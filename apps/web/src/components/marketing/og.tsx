import { ImageResponse } from "next/og";

/** Standard OG card dimensions (1.91:1) used by every marketing opengraph-image. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Branded social-share card — dark canvas + violet→blue aurora glow, Citensity wordmark,
 * a small eyebrow, and the page title. Rendered via Satori (next/og), so styles are
 * limited to the supported flexbox subset (every multi-child node sets display:flex).
 */
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
          padding: "72px",
          backgroundColor: "#0a0b0d",
          backgroundImage:
            "radial-gradient(900px 520px at 12% -10%, rgba(108,76,241,0.55), transparent 60%), radial-gradient(800px 520px at 100% 110%, rgba(45,107,255,0.40), transparent 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundImage: "linear-gradient(135deg, #8b5cf6, #2d6bff)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "18px", height: "18px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.92)" }} />
          </div>
          <div style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.01em" }}>Citensity</div>
        </div>

        {/* title block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#b9a8fb",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "20px",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "24px", color: "rgba(255,255,255,0.66)" }}>
          <div style={{ display: "flex", width: "10px", height: "10px", borderRadius: "9999px", backgroundColor: "#16b364" }} />
          Be the answer buyers find — in Google and AI.
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
