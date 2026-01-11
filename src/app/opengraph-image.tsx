import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Hotpress - Write together. Publish instantly.";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          position: "relative",
        }}
      >
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: "12px solid #000000",
            display: "flex",
          }}
        />

        {/* Yellow accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "20px",
            backgroundColor: "#FFE75C",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          {/* Logo box */}
          <div
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
              boxShadow: "8px 8px 0 0 #FFE75C",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "72px",
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              H
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "96px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#000000",
              margin: 0,
              fontFamily: "system-ui, sans-serif",
              textTransform: "uppercase",
            }}
          >
            Hotpress
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: "32px",
              color: "#666666",
              marginTop: "20px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Write together. Publish instantly.
          </p>

          {/* Feature badges */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "40px",
            }}
          >
            {["GitHub Sync", "Real-time Collaboration", "Version History"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "3px solid #000000",
                    fontSize: "18px",
                    fontWeight: 700,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {feature}
                </div>
              )
            )}
          </div>
        </div>

        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
