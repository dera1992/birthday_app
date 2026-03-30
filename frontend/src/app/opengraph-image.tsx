import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Celnoia — Birthday Experiences & Celebrations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F9F7F5",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, color: "#E8294A", letterSpacing: "-2px" }}>
          celnoia
        </div>
        <div style={{ fontSize: 28, color: "#6B7280", textAlign: "center", maxWidth: 700 }}>
          Premium birthday experiences, protected payments, and warm guest support.
        </div>
      </div>
    ),
    { ...size }
  );
}
