import { ImageResponse } from "@vercel/og";

function getParam(searchParams, key, fallback = "") {
  const value = searchParams.get(key);
  return value == null || value === "" ? fallback : value;
}

function formatCentsDisplay(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === "\u2014") return "\u2014";
  return /^[0-9.]+$/.test(raw) ? `${raw}\u00a2` : raw;
}

function buildLegacyCard(searchParams) {
  const title = getParam(searchParams, "title", "Prediction Market");
  const yes = formatCentsDisplay(getParam(searchParams, "yes", "\u2014"));
  const no = formatCentsDisplay(getParam(searchParams, "no", "\u2014"));
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
        justifyContent: "space-between",
        background: "#080a09",
        color: "#eef2ef",
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
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-220px",
              left: "160px",
              width: "820px",
              height: "620px",
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
              gap: "34px",
              padding: "52px 60px 0",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#00e38f",
                    fontSize: "18px",
                    fontWeight: "700",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  },
                  children: "Headline Odds",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: title.length > 66 ? "38px" : "48px",
                    fontWeight: "800",
                    lineHeight: "1.12",
                    letterSpacing: "-0.03em",
                    maxWidth: "980px",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          flex: 1,
                          borderRadius: "24px",
                          padding: "22px 24px",
                          background: "rgba(0,227,143,0.1)",
                          border: "1px solid rgba(0,227,143,0.2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "16px",
                                color: "#b5c5bd",
                                fontWeight: "700",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              },
                              children: "Yes",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "40px",
                                color: "#00e38f",
                                fontWeight: "800",
                                letterSpacing: "-0.04em",
                              },
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
                          flex: 1,
                          borderRadius: "24px",
                          padding: "22px 24px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "16px",
                                color: "#b5c5bd",
                                fontWeight: "700",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                              },
                              children: "No",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: {
                                fontSize: "40px",
                                color: "#eef2ef",
                                fontWeight: "800",
                                letterSpacing: "-0.04em",
                              },
                              children: no,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              volume || closes
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        gap: "24px",
                        flexWrap: "wrap",
                        fontSize: "18px",
                        color: "#7e8d87",
                        fontWeight: "500",
                      },
                      children: [
                        volume
                          ? {
                              type: "span",
                              props: { children: `Volume ${volume}` },
                            }
                          : null,
                        closes
                          ? {
                              type: "span",
                              props: { children: `Closes ${closes}` },
                            }
                          : null,
                      ].filter(Boolean),
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
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 60px 34px",
              color: "#7e8d87",
              fontSize: "18px",
              fontWeight: "500",
            },
            children: [
              {
                type: "span",
                props: {
                  style: { color: "#00e38f", fontWeight: "700" },
                  children: "headlineodds.fun/scanner",
                },
              },
              {
                type: "span",
                props: { children: "Search live market prices." },
              },
            ],
          },
        },
      ],
    },
  };
}

function buildBayseCard(searchParams) {
  const title = getParam(searchParams, "title", "Bayse market");
  const bayseTitle = getParam(searchParams, "bayseTitle", "Open Bayse market");
  const bayseSubtitle = getParam(searchParams, "bayseSubtitle", "Live Bayse market");
  const bayseLabel1 = getParam(searchParams, "bayseLabel1", "Outcome 1");
  const baysePrice1 = formatCentsDisplay(getParam(searchParams, "baysePrice1", "\u2014"));
  const bayseLabel2 = getParam(searchParams, "bayseLabel2", "Outcome 2");
  const baysePrice2 = formatCentsDisplay(getParam(searchParams, "baysePrice2", "\u2014"));
  const bayseMeta = getParam(searchParams, "bayseMeta", "Open on Bayse");
  const bayseClose = getParam(searchParams, "bayseClose");
  const bayseCategory = getParam(searchParams, "bayseCategory", "Open market");

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
        color: "#eef2ef",
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
              width: "760px",
              height: "760px",
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
              bottom: "-240px",
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
              padding: "46px 52px 0",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
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
                        children: "Bayse Market",
                      },
                    },
                    bayseCategory
                      ? {
                          type: "div",
                          props: {
                            style: {
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "8px 14px",
                              borderRadius: "999px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#cfd6e8",
                              fontSize: "18px",
                              fontWeight: "700",
                            },
                            children: bayseCategory,
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
                    width: "100%",
                  },
                  children: {
                    type: "div",
                    props: {
                      style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        padding: "28px",
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
                              fontSize: "32px",
                              fontWeight: "700",
                              lineHeight: "1.22",
                              letterSpacing: "-0.03em",
                              minHeight: "78px",
                            },
                            children: bayseTitle,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "18px",
                              lineHeight: "1.5",
                              color: "#c7d3ef",
                              minHeight: "54px",
                            },
                            children: bayseSubtitle,
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
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              gap: "18px",
                              flexWrap: "wrap",
                              color: "#a9b7d2",
                              fontSize: "16px",
                              lineHeight: "1.5",
                            },
                            children: [
                              {
                                type: "span",
                                props: {
                                  children: [
                                    "Category: ",
                                    {
                                      type: "span",
                                      props: {
                                        style: { color: "#eef2ef", fontWeight: "600" },
                                        children: bayseCategory,
                                      },
                                    },
                                  ],
                                },
                              },
                              bayseClose
                                ? {
                                    type: "span",
                                    props: {
                                      children: [
                                        "Closes: ",
                                        {
                                          type: "span",
                                          props: {
                                            style: { color: "#eef2ef", fontWeight: "600" },
                                            children: bayseClose,
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
                  children: "Search Bayse. Share live prices.",
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
    : buildLegacyCard(searchParams);

  return new ImageResponse(card, { width: 1200, height: 630 });
}
