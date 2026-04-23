import { unstable_createNodejsStream } from "@vercel/og";

function getHeader(req, key) {
  const headers = req?.headers;
  if (!headers) return "";

  if (typeof headers.get === "function") {
    return headers.get(key) || "";
  }

  const direct = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] || "";
  return direct ? String(direct) : "";
}

function getRequestUrl(req) {
  const rawUrl = typeof req?.url === "string" && req.url ? req.url : "/api/og";

  try {
    return new URL(rawUrl);
  } catch {
    const proto = getHeader(req, "x-forwarded-proto") || "https";
    const host = getHeader(req, "x-forwarded-host") || getHeader(req, "host") || "headlineodds.fun";
    return new URL(rawUrl, `${proto}://${host}`);
  }
}

function getParam(searchParams, keys, fallback = "") {
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const value = searchParams.get(key);
    if (value != null && value !== "") return value;
  }

  return fallback;
}

function getTheme(searchParams) {
  const raw = getParam(searchParams, ["th", "theme"], "default");
  return raw === "b" ? "bayse" : raw;
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
  const title = getParam(searchParams, ["t", "title"], "Bayse market");
  const focus = getParam(searchParams, ["f", "bayseFocus"]);
  const meta = getParam(searchParams, ["m", "bayseMeta"], "Open Bayse market");
  const close = getParam(searchParams, ["c", "bayseClose"], "Open market");
  const rows = parseRowsParam(getParam(searchParams, ["r", "rows"]));
  const preview = rows[0] || {
    title: "",
    yesLabel: getParam(searchParams, ["yl", "bayseLabel1"], "Yes"),
    yesPrice: getParam(searchParams, ["yp", "baysePrice1"], "\u2014"),
    noLabel: getParam(searchParams, ["nl", "bayseLabel2"], "No"),
    noPrice: getParam(searchParams, ["np", "baysePrice2"], "\u2014"),
  };
  const detail = focus || preview.title || "";
  const footerMeta = [meta, close].filter(Boolean).join("     ");

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #050814 0%, #02040b 100%)",
        color: "#ffffff",
        fontFamily: "\"Plus Jakarta Sans\", sans-serif",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              inset: "0",
              background: "radial-gradient(circle at 50% 16%, rgba(31, 108, 240, 0.26) 0%, rgba(0, 0, 0, 0) 42%)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "1020px",
              height: "450px",
              borderRadius: "30px",
              background: "linear-gradient(180deg, rgba(7, 10, 24, 0.94) 0%, rgba(3, 5, 12, 0.98) 100%)",
              border: "1px solid rgba(76, 110, 190, 0.45)",
              boxShadow: "0 28px 100px rgba(0, 0, 0, 0.48)",
              position: "relative",
              overflow: "hidden",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    inset: "0",
                    backgroundImage: "linear-gradient(rgba(52, 77, 136, 0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 77, 136, 0.28) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                    opacity: "0.24",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    inset: "0",
                    background: "radial-gradient(circle at 50% 12%, rgba(31, 108, 240, 0.22) 0%, rgba(0, 0, 0, 0) 48%)",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    position: "relative",
                    zIndex: "1",
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "44px 70px 22px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: detail ? "24px" : "34px",
                          color: "rgba(241, 247, 255, 0.78)",
                          fontSize: "22px",
                          fontWeight: "600",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: "32px",
                                height: "32px",
                                borderRadius: "999px",
                                background: "#070b17",
                                border: "1px solid rgba(82, 119, 199, 0.68)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "#11c46b",
                                      fontSize: "16px",
                                      fontWeight: "800",
                                      letterSpacing: "-0.08em",
                                    },
                                    children: "H",
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "#f5f9ff",
                                      fontSize: "16px",
                                      fontWeight: "800",
                                      letterSpacing: "-0.08em",
                                    },
                                    children: "O",
                                  },
                                },
                              ],
                            },
                          },
                          "Headline Odds",
                        ],
                      },
                    },
                    detail
                      ? {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: "18px",
                              padding: "8px 16px",
                              borderRadius: "999px",
                              background: "rgba(31, 108, 240, 0.08)",
                              border: "1px solid rgba(31, 108, 240, 0.18)",
                              color: "#8fb7ff",
                              fontSize: "16px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            },
                            children: detail,
                          },
                        }
                      : null,
                    {
                      type: "div",
                      props: {
                        style: {
                          maxWidth: "780px",
                          textAlign: "center",
                          color: "#f2f7ff",
                          fontSize: title.length > 72 ? "44px" : title.length > 44 ? "52px" : "58px",
                          fontWeight: "700",
                          letterSpacing: "-0.05em",
                          lineHeight: "1.12",
                          marginBottom: "28px",
                        },
                        children: title,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          marginBottom: "22px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                minWidth: "178px",
                                minHeight: "72px",
                                padding: "0 24px",
                                borderRadius: "999px",
                                background: "rgba(10, 35, 82, 0.88)",
                                border: "1px solid rgba(31, 108, 240, 0.32)",
                                boxShadow: "0 0 0 1px rgba(31, 108, 240, 0.14) inset",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "999px",
                                      background: "#1f6cf0",
                                    },
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "rgba(214, 229, 255, 0.9)",
                                      fontSize: "22px",
                                      fontWeight: "600",
                                    },
                                    children: preview.yesLabel,
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "#1f6cf0",
                                      fontSize: "34px",
                                      fontWeight: "800",
                                      letterSpacing: "-0.04em",
                                    },
                                    children: preview.yesPrice,
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                minWidth: "178px",
                                minHeight: "72px",
                                padding: "0 24px",
                                borderRadius: "999px",
                                background: "rgba(18, 22, 35, 0.88)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "rgba(204, 214, 232, 0.86)",
                                      fontSize: "22px",
                                      fontWeight: "600",
                                    },
                                    children: preview.noLabel,
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      color: "#f2f7ff",
                                      fontSize: "34px",
                                      fontWeight: "800",
                                      letterSpacing: "-0.04em",
                                    },
                                    children: preview.noPrice,
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
                          alignItems: "center",
                          gap: "34px",
                          color: "rgba(208, 218, 238, 0.7)",
                          fontSize: "18px",
                          fontWeight: "500",
                        },
                        children: [meta, close],
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
                    zIndex: "1",
                    minHeight: "58px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 26px",
                    background: "linear-gradient(90deg, rgba(12, 53, 132, 0.58) 0%, rgba(9, 26, 64, 0.46) 52%, rgba(6, 8, 7, 0.82) 100%)",
                    borderTop: "1px solid rgba(79, 121, 206, 0.35)",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#f5f9ff",
                          fontSize: "16px",
                          fontWeight: "700",
                        },
                        children: title,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "rgba(155, 194, 255, 0.86)",
                          fontSize: "14px",
                          fontWeight: "500",
                        },
                        children: "headlineodds.fun/scanner  \u2014  Powered by Bayse Markets",
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

export default async function handler(req, res) {
  const { searchParams } = getRequestUrl(req);
  const theme = getTheme(searchParams);
  const card = theme === "bayse"
    ? buildBayseCard(searchParams)
    : buildLegacyCard(searchParams);
  const stream = await unstable_createNodejsStream(card, { width: 1200, height: 630 });

  if (!res) {
    return new Response(stream, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    });
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  stream.pipe(res);
  return;
}
