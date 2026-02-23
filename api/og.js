import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Prediction Market";
  const yes = searchParams.get("yes") || "—";
  const no = searchParams.get("no") || "—";
  const volume = searchParams.get("vol") || "";
  const closes = searchParams.get("closes") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#080a09",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Green glow top */}
        <div
          style={{
            position: "absolute",
            top: "-300px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,227,143,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Green glow bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,198,94,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Content card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 80px",
            position: "relative",
            zIndex: "1",
            width: "100%",
          }}
        >
          {/* Logo + wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00e38f, #00c65e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#080a09",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#eef2ef",
                letterSpacing: "-0.02em",
              }}
            >
              Headline Odds
            </span>
          </div>

          {/* Market title */}
          <div
            style={{
              fontSize: title.length > 60 ? "36px" : "44px",
              fontWeight: "800",
              color: "#eef2ef",
              textAlign: "center",
              lineHeight: "1.15",
              letterSpacing: "-0.03em",
              marginBottom: "48px",
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {/* Odds pills */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "36px",
            }}
          >
            {/* Yes pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(0,227,143,0.1)",
                border: "2px solid rgba(0,227,143,0.3)",
                borderRadius: "999px",
                padding: "16px 36px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#00e38f",
                  boxShadow: "0 0 12px rgba(0,227,143,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#a9b5ae",
                }}
              >
                Yes
              </span>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#00e38f",
                }}
              >
                {yes}¢
              </span>
            </div>

            {/* No pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "2px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "16px 36px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#a9b5ae",
                }}
              >
                No
              </span>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#eef2ef",
                }}
              >
                {no}¢
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              fontSize: "18px",
              color: "#55625d",
              fontWeight: "500",
            }}
          >
            {volume ? (
              <span style={{ display: "flex" }}>
                Vol: <span style={{ color: "#a9b5ae", marginLeft: "6px" }}>{volume}</span>
              </span>
            ) : null}
            {closes ? (
              <span style={{ display: "flex" }}>
                Closes: <span style={{ color: "#a9b5ae", marginLeft: "6px" }}>{closes}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "56px",
            background: "rgba(0,227,143,0.06)",
            borderTop: "1px solid rgba(0,227,143,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#00e38f",
              letterSpacing: "0.02em",
            }}
          >
            headlineodds.fun/scanner
          </span>
          <span style={{ fontSize: "14px", color: "#55625d" }}>
            — Powered by Kalshi
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
