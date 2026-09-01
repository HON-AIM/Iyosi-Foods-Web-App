import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Iyosi Foods LTD — Premium Food Products in Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #14532d 0%, #166534 45%, #15803d 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#fde047",
            marginBottom: 16,
          }}
        >
          Iyosi Foods LTD
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Premium Food & Agro-Allied Products
        </div>
        <div style={{ fontSize: 28, opacity: 0.92, maxWidth: 820 }}>
          Flour, sugar, rice, oils & more — delivered across Nigeria
        </div>
      </div>
    ),
    { ...size }
  );
}
