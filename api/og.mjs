import { ImageResponse } from "@vercel/og";

function getParam(searchParams, key, fallback = "") {
  const value = searchParams.get(key);
  return value == null || value === "" ? fallback : value;
}

function parseRowsParam(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(row => ({
        title: row?.title ? String(row.title) : "",
        yesLabel: row?.yesLabel ? String(row.yesLabel) : "Yes",
        yesPrice: row?.yesPrice ? String(row.yesPrice) : "\u2014",
        noLabel: row?.noLabel ? String(row.noLabel) : "No",
        noPrice: row?.noPrice ? String(row.noPrice) : "\u2014",
      }))
      .filter(row => row.yesPrice || row.noPrice)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function getFallbackInitials(title) {
  const initials = String(title || "Bayse")
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0] || "")
    .join("")
    .toUpperCase();

  return initials || "BY";
}

function buildLegacyCard(searchParams) {
  const title = getParam(searchParams, "title", "Prediction Market");
  const yes = getParam(searchParams, "yes", "\u2014");
  const no = getParam(searchParams, "no", "\u2014");

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
        background: "#0c1222",
        color: "#ffffff",
        fontFamily: "\"Plus Jakarta Sans\", sans-serif",
        padding: "56px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: "46px",
              fontWeight: "800",
              lineHeight: "1.14",
              letterSpacing: "-0.04em",
              textAlign: "center",
              maxWidth: "980px",
              marginBottom: "18px",
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              gap: "14px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    minWidth: "220px",
                    padding: "20px 24px",
                    borderRadius: "22px",
                    background: "rgba(31,108,240,0.18)",
                    border: "1px solid rgba(189,213,255,0.28)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  },
                  children: [
                    { type: "span", props: { style: { fontSize: "18px", color: "#bdd5ff", fontWeight: "700", textTransform: "uppercase" }, children: "Yes" } },
                    { type: "span", props: { style: { fontSize: "42px", color: "#ffffff", fontWeight: "800", letterSpacing: "-0.04em" }, children: yes } },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    minWidth: "220px",
                    padding: "20px 24px",
                    borderRadius: "22px",
                    background: "rgba(255,93,93,0.12)",
                    border: "1px solid rgba(255,208,208,0.32)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  },
                  children: [
                    { type: "span", props: { style: { fontSize: "18px", color: "#ffb6b6", fontWeight: "700", textTransform: "uppercase" }, children: "No" } },
                    { type: "span", props: { style: { fontSize: "42px", color: "#ffffff", fontWeight: "800", letterSpacing: "-0.04em" }, children: no } },
                  ],
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
  const title = getParam(searchParams, "title", "Bayse market");
  const subtitle = getParam(searchParams, "bayseSubtitle", "Live Bayse market");
  const category = getParam(searchParams, "bayseCategory", "Open market");
  const meta = getParam(searchParams, "bayseMeta", "Open Bayse market");
  const close = getParam(searchParams, "bayseClose", "Open market");
  const image = getParam(searchParams, "image");
  const rows = parseRowsParam(getParam(searchParams, "rows"));
  const displayRows = rows.length
    ? rows
    : [{
        title: "",
        yesLabel: getParam(searchParams, "bayseLabel1", "Yes"),
        yesPrice: getParam(searchParams, "baysePrice1", "\u2014"),
        noLabel: getParam(searchParams, "bayseLabel2", "No"),
        noPrice: getParam(searchParams, "baysePrice2", "\u2014"),
      }];

  const rowNodes = displayRows.map((row, index) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "14px 0",
        borderTop: index === 0 ? "none" : "1px solid #eef3ff",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              color: "#4c6da9",
              fontSize: "24px",
              fontWeight: "700",
              lineHeight: "1.4",
            },
            children: row.title || "",
          },
        },
        {
          type: "div",
          props: {
            style: {
              minWidth: "206px",
              minHeight: "58px",
              borderRadius: "0px",
              background: "#f2f7ff",
              border: "1px solid #bdd5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1f6cf0",
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
              padding: "0 18px",
            },
            children: `${row.yesLabel} ${row.yesPrice}`,
          },
        },
        {
          type: "div",
          props: {
            style: {
              minWidth: "206px",
              minHeight: "58px",
              borderRadius: "0px",
              background: "#fff7f7",
              border: "1px solid #ffd0d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff5d5d",
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
              padding: "0 18px",
            },
            children: `${row.noLabel} ${row.noPrice}`,
          },
        },
      ],
    },
  }));

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        background: "#f5f8ff",
        color: "#183b83",
        fontFamily: "\"Plus Jakarta Sans\", sans-serif",
        padding: "34px 40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#1f6cf0",
                    fontSize: "34px",
                    fontWeight: "800",
                    letterSpacing: "-0.04em",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "36px",
                          height: "36px",
                          borderRadius: "12px",
                          background: "#1f6cf0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          fontSize: "16px",
                          fontWeight: "800",
                        },
                        children: "b",
                      },
                    },
                    "bayse",
                  ],
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
                          minWidth: "96px",
                          minHeight: "46px",
                          padding: "0 18px",
                          borderRadius: "12px",
                          background: "#f5f8ff",
                          border: "1px solid #edf2ff",
                          color: "#1f6cf0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "700",
                        },
                        children: "Log In",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          minWidth: "110px",
                          minHeight: "46px",
                          padding: "0 18px",
                          borderRadius: "12px",
                          background: "#1f6cf0",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "700",
                        },
                        children: "Sign Up",
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
              borderRadius: "18px",
              background: "#ffffff",
              border: "1px solid #dbe6ff",
              padding: "18px",
              boxShadow: "0 18px 40px rgba(31,108,240,0.08)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginBottom: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          flex: 1,
                          minWidth: 0,
                        },
                        children: [
                          image
                            ? {
                                type: "img",
                                props: {
                                  src: image,
                                  width: "46",
                                  height: "46",
                                  style: {
                                    width: "46px",
                                    height: "46px",
                                    borderRadius: "999px",
                                    border: "1px solid #e7eeff",
                                  },
                                },
                              }
                            : {
                                type: "div",
                                props: {
                                  style: {
                                    width: "46px",
                                    height: "46px",
                                    borderRadius: "999px",
                                    background: "#f0f5ff",
                                    border: "1px solid #e7eeff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1f6cf0",
                                    fontSize: "14px",
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                  },
                                  children: getFallbackInitials(title),
                                },
                              },
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                flex: 1,
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      color: "#183b83",
                                      fontSize: title.length > 70 ? "30px" : "34px",
                                      fontWeight: "800",
                                      letterSpacing: "-0.04em",
                                      lineHeight: "1.18",
                                    },
                                    children: title,
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      color: "#4c6da9",
                                      fontSize: "18px",
                                      lineHeight: "1.5",
                                    },
                                    children: subtitle,
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
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 14px",
                          borderRadius: "999px",
                          background: "#eef4ff",
                          color: "#1f6cf0",
                          fontSize: "16px",
                          fontWeight: "800",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        },
                        children: category,
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
                    flexDirection: "column",
                    flex: 1,
                  },
                  children: rowNodes,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginTop: "14px",
                    paddingTop: "16px",
                    borderTop: "1px solid #eef3ff",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          gap: "18px",
                          color: "#88a0cf",
                          fontSize: "18px",
                          fontWeight: "600",
                        },
                        children: [meta, close],
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
                                minWidth: "146px",
                                minHeight: "42px",
                                padding: "0 16px",
                                borderRadius: "999px",
                                background: "#eef4ff",
                                border: "1px solid #dbe6ff",
                                color: "#1f6cf0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: "700",
                              },
                              children: "Share to X",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                minWidth: "152px",
                                minHeight: "42px",
                                padding: "0 16px",
                                borderRadius: "999px",
                                background: "#ffffff",
                                border: "1px solid #dbe6ff",
                                color: "#183b83",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: "700",
                              },
                              children: "Trade on Bayse",
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
