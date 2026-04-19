import { ImageResponse } from "@vercel/og";

function getParam(searchParams, key, fallback = "") {
  const value = searchParams.get(key);
  return value == null || value === "" ? fallback : value;
}

function formatCentsDisplay(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "—") return "—";
  return /^[0-9.]+$/.test(raw) ? `${raw}¢` : raw;
}

function buildLegacyCard(req, searchParams) {
  const title = getParam(searchParams, "title", "Prediction Market");
  const yes = formatCentsDisplay(getParam(searchParams, "yes", "—"));
  const no = formatCentsDisplay(getParam(searchParams, "no", "—"));
  const volume = getParam(searchParams, "vol");
  const closes = getParam(searchParams, "closes");

  return {
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
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            },
          },
        },
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
                        style: { borderRadius: "50%" },
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
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "24px",
                    marginBottom: "36px",
                  },
                  children: [
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
                              children: yes,
                            },
                          },
                        ],
                      },
                    },
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
                              children: no,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
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
                              {
                                type: "span",
                                props: {
                                  style: { color: "#a9b5ae", marginLeft: "6px" },
                                  children: volume,
                                },
                              },
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
                              {
                                type: "span",
                                props: {
                                  style: { color: "#a9b5ae", marginLeft: "6px" },
                                  children: closes,
                                },
                              },
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
                  children: "- Powered by Kalshi",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function buildBayseCard(searchParams) {
  const title = getParam(searchParams, "title", "Bayse x Kalshi crossover");
  const bayseTitle = getParam(searchParams, "bayseTitle", "Open Bayse market");
  const bayseLabel1 = getParam(searchParams, "bayseLabel1", "Outcome 1");
  const baysePrice1 = formatCentsDisplay(getParam(searchParams, "baysePrice1", "—"));
  const bayseLabel2 = getParam(searchParams, "bayseLabel2", "Outcome 2");
  const baysePrice2 = formatCentsDisplay(getParam(searchParams, "baysePrice2", "—"));
  const bayseMeta = getParam(searchParams, "bayseMeta", "Open on Bayse");
  const kalshiTitle = getParam(searchParams, "kalshiTitle", "Matched Kalshi market");
  const kalshiYes = formatCentsDisplay(getParam(searchParams, "kalshiYes", "—"));
  const kalshiNo = formatCentsDisplay(getParam(searchParams, "kalshiNo", "—"));
  const kalshiMeta = getParam(searchParams, "kalshiMeta", "Live Kalshi price");
  const match = getParam(searchParams, "match");

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#050816",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
        color: "#eef2ef",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              width: "720px",
              height: "720px",
              top: "-280px",
              right: "-160px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(79,124,255,0.24) 0%, transparent 68%)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              width: "580px",
              height: "580px",
              bottom: "-220px",
              left: "-140px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,227,143,0.14) 0%, transparent 70%)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "28px",
              padding: "46px 52px 24px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "18px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 16px",
                                borderRadius: "999px",
                                background: "rgba(79,124,255,0.14)",
                                border: "1px solid rgba(141,176,255,0.22)",
                                color: "#8db0ff",
                                fontSize: "18px",
                                fontWeight: "700",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              },
                              children: "Bayse x Kalshi",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "18px",
                                color: "#8fa2c7",
                                fontWeight: "500",
                              },
                              children: "Live prices at share time",
                            },
                          },
                        ],
                      },
                    },
                    match
                      ? {
                          type: "div",
                          props: {
                            style: {
                              padding: "8px 14px",
                              borderRadius: "999px",
                              background: "rgba(0,227,143,0.1)",
                              border: "1px solid rgba(0,227,143,0.18)",
                              color: "#7af1be",
                              fontSize: "18px",
                              fontWeight: "700",
                            },
                            children: `${match}% fit`,
                          },
                        }
                      : null,
                  ].filter(Boolean),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: title.length > 68 ? "38px" : "46px",
                    lineHeight: "1.12",
                    fontWeight: "800",
                    letterSpacing: "-0.03em",
                    maxWidth: "1020px",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "20px",
                    width: "100%",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          padding: "24px",
                          borderRadius: "28px",
                          background: "linear-gradient(180deg, rgba(79,124,255,0.18), rgba(10,17,38,0.92))",
                          border: "1px solid rgba(141,176,255,0.18)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: "18px",
                                      fontWeight: "700",
                                      letterSpacing: "0.05em",
                                      textTransform: "uppercase",
                                      color: "#8db0ff",
                                    },
                                    children: "Bayse",
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: "16px",
                                      color: "#91a7d4",
                                    },
                                    children: bayseMeta,
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "30px",
                                fontWeight: "700",
                                lineHeight: "1.24",
                                letterSpacing: "-0.03em",
                                minHeight: "72px",
                              },
                              children: bayseTitle,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                gap: "12px",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      flex: 1,
                                      borderRadius: "20px",
                                      padding: "18px",
                                      background: "rgba(79,124,255,0.16)",
                                      border: "1px solid rgba(141,176,255,0.15)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    },
                                    children: [
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            color: "#bfd2ff",
                                          },
                                          children: bayseLabel1,
                                        },
                                      },
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "34px",
                                            fontWeight: "800",
                                            letterSpacing: "-0.04em",
                                            color: "#ffffff",
                                          },
                                          children: baysePrice1,
                                        },
                                      },
                                    ],
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      flex: 1,
                                      borderRadius: "20px",
                                      padding: "18px",
                                      background: "rgba(79,124,255,0.16)",
                                      border: "1px solid rgba(141,176,255,0.15)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    },
                                    children: [
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            color: "#bfd2ff",
                                          },
                                          children: bayseLabel2,
                                        },
                                      },
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "34px",
                                            fontWeight: "800",
                                            letterSpacing: "-0.04em",
                                            color: "#ffffff",
                                          },
                                          children: baysePrice2,
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          padding: "24px",
                          borderRadius: "28px",
                          background: "linear-gradient(180deg, rgba(0,227,143,0.12), rgba(8,10,9,0.92))",
                          border: "1px solid rgba(0,227,143,0.16)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: "18px",
                                      fontWeight: "700",
                                      letterSpacing: "0.05em",
                                      textTransform: "uppercase",
                                      color: "#7af1be",
                                    },
                                    children: "Kalshi",
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      fontSize: "16px",
                                      color: "#90a89f",
                                    },
                                    children: kalshiMeta,
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "30px",
                                fontWeight: "700",
                                lineHeight: "1.24",
                                letterSpacing: "-0.03em",
                                minHeight: "72px",
                              },
                              children: kalshiTitle,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                gap: "12px",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      flex: 1,
                                      borderRadius: "20px",
                                      padding: "18px",
                                      background: "rgba(0,227,143,0.12)",
                                      border: "1px solid rgba(0,227,143,0.16)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    },
                                    children: [
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            color: "#9ee8c5",
                                          },
                                          children: "Yes",
                                        },
                                      },
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "34px",
                                            fontWeight: "800",
                                            letterSpacing: "-0.04em",
                                            color: "#00e38f",
                                          },
                                          children: kalshiYes,
                                        },
                                      },
                                    ],
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      flex: 1,
                                      borderRadius: "20px",
                                      padding: "18px",
                                      background: "rgba(255,255,255,0.05)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    },
                                    children: [
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            letterSpacing: "0.04em",
                                            textTransform: "uppercase",
                                            color: "#d6dbd8",
                                          },
                                          children: "No",
                                        },
                                      },
                                      {
                                        type: "span",
                                        props: {
                                          style: {
                                            fontSize: "34px",
                                            fontWeight: "800",
                                            letterSpacing: "-0.04em",
                                            color: "#eef2ef",
                                          },
                                          children: kalshiNo,
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 52px 34px",
              color: "#93a0bd",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#dfe7ff",
                    letterSpacing: "-0.02em",
                  },
                  children: "headlineodds.fun/scanner",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "18px",
                    fontWeight: "500",
                  },
                  children: "Search Bayse. See the Kalshi crossover.",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const theme = getParam(searchParams, "theme", "default");
  const card = theme === "bayse"
    ? buildBayseCard(searchParams)
    : buildLegacyCard(req, searchParams);

  return new ImageResponse(card, { width: 1200, height: 630 });
}
