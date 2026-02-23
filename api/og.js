import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Prediction Market";
  const yes = searchParams.get("yes") || "—";
  const no = searchParams.get("no") || "—";
  const volume = searchParams.get("vol") || "";
  const closes = searchParams.get("closes") || "";

  const html = {
    type: "div",
    props: {
      style: {
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
      },
      children: [
        // Grid background
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            },
          },
        },
        // Green glow top
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-300px",
              left: "150px",
              width: "900px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,227,143,0.12) 0%, transparent 70%)",
            },
          },
        },
        // Content
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 80px",
              position: "relative",
              zIndex: 1,
              width: "100%",
            },
            children: [
              // Logo + wordmark
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "40px",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: `${new URL(req.url).origin}/logo.png`,
                        width: "36",
                        height: "36",
                        style: {
                          borderRadius: "50%",
                        },
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#eef2ef",
                          letterSpacing: "-0.02em",
                        },
                        children: "Headline Odds",
                      },
                    },
                  ],
                },
              },
              // Market title
              {
                type: "div",
                props: {
                  style: {
                    fontSize: title.length > 60 ? "36px" : "44px",
                    fontWeight: "800",
                    color: "#eef2ef",
                    textAlign: "center",
                    lineHeight: "1.15",
                    letterSpacing: "-0.03em",
                    marginBottom: "48px",
                    maxWidth: "900px",
                  },
                  children: title,
                },
              },
              // Odds row
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "24px",
                    marginBottom: "36px",
                  },
                  children: [
                    // Yes pill
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          background: "rgba(0,227,143,0.1)",
                          border: "2px solid rgba(0,227,143,0.3)",
                          borderRadius: "999px",
                          padding: "16px 36px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: "#00e38f",
                                boxShadow: "0 0 12px rgba(0,227,143,0.6)",
                              },
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "20px", fontWeight: "600", color: "#a9b5ae" },
                              children: "Yes",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "32px", fontWeight: "800", color: "#00e38f" },
                              children: `${yes}\u00a2`,
                            },
                          },
                        ],
                      },
                    },
                    // No pill
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "2px solid rgba(255,255,255,0.1)",
                          borderRadius: "999px",
                          padding: "16px 36px",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "20px", fontWeight: "600", color: "#a9b5ae" },
                              children: "No",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "32px", fontWeight: "800", color: "#eef2ef" },
                              children: `${no}\u00a2`,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Meta row
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "32px",
                    fontSize: "18px",
                    color: "#55625d",
                    fontWeight: "500",
                  },
                  children: [
                    volume
                      ? {
                          type: "span",
                          props: {
                            style: { display: "flex" },
                            children: [
                              "Vol: ",
                              { type: "span", props: { style: { color: "#a9b5ae", marginLeft: "6px" }, children: volume } },
                            ],
                          },
                        }
                      : null,
                    closes
                      ? {
                          type: "span",
                          props: {
                            style: { display: "flex" },
                            children: [
                              "Closes: ",
                              { type: "span", props: { style: { color: "#a9b5ae", marginLeft: "6px" }, children: closes } },
                            ],
                          },
                        }
                      : null,
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
        // Bottom bar
        {
          type: "div",
          props: {
            style: {
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
            },
            children: [
              {
                type: "span",
                props: {
                  style: { fontSize: "16px", fontWeight: "600", color: "#00e38f", letterSpacing: "0.02em" },
                  children: "headlineodds.fun/scanner",
                },
              },
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#55625d" },
                  children: "\u2014 Powered by Kalshi",
                },
              },
            ],
          },
        },
      ],
    },
  };

  return new ImageResponse(html, { width: 1200, height: 630 });
}
