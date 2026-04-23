import React from "react";
import { ImageResponse } from "@vercel/og";

const { createElement: h } = React;

function el(type, props, ...children) {
  const flat = children.flat().filter(child => child !== null && child !== undefined && child !== false);
  return h(type, props, ...flat);
}

function getHeader(request, key) {
  const headers = request?.headers;
  if (!headers) return "";

  if (typeof headers.get === "function") {
    return headers.get(key) || "";
  }

  const direct = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] || "";
  return direct ? String(direct) : "";
}

function getRequestUrl(request) {
  const rawUrl = typeof request?.url === "string" && request.url ? request.url : "/api/og";

  try {
    return new URL(rawUrl);
  } catch {
    const proto = getHeader(request, "x-forwarded-proto") || "https";
    const host = getHeader(request, "x-forwarded-host") || getHeader(request, "host") || "headlineodds.fun";
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

function getBayseCard(searchParams) {
  const title = getParam(searchParams, ["t", "title"], "Bayse market");
  const focus = getParam(searchParams, ["f", "bayseFocus"]);
  const meta = getParam(searchParams, ["m", "bayseMeta"], "Open Bayse market");
  const close = getParam(searchParams, ["c", "bayseClose"], "Open market");
  const yesLabel = getParam(searchParams, ["yl", "bayseLabel1"], "Yes");
  const yesPrice = getParam(searchParams, ["yp", "baysePrice1"], "--");
  const noLabel = getParam(searchParams, ["nl", "bayseLabel2"], "No");
  const noPrice = getParam(searchParams, ["np", "baysePrice2"], "--");
  const titleSize = title.length > 80 ? "48px" : title.length > 54 ? "58px" : "68px";

  const brand = el(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        color: "rgba(241,247,255,0.78)",
        fontSize: "24px",
        fontWeight: 600,
      },
    },
    el(
      "div",
      {
        style: {
          width: "36px",
          height: "36px",
          marginRight: "12px",
          borderRadius: "999px",
          border: "1px solid rgba(82,119,199,0.68)",
          background: "#070b17",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      el("span", { style: { color: "#11c46b", fontSize: "18px", fontWeight: 800 } }, "H"),
      el("span", { style: { color: "#f5f9ff", fontSize: "18px", fontWeight: 800 } }, "O")
    ),
    "Headline Odds"
  );

  const pricePill = (label, value, tone) =>
    el(
      "div",
      {
        style: {
          minWidth: "220px",
          minHeight: "84px",
          padding: "0 26px",
          marginRight: tone === "yes" ? "16px" : "0",
          borderRadius: "999px",
          border: tone === "yes" ? "1px solid rgba(31,108,240,0.32)" : "1px solid rgba(255,255,255,0.12)",
          background: tone === "yes" ? "rgba(10,35,82,0.88)" : "rgba(18,22,35,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      el(
        "span",
        {
          style: {
            color: tone === "yes" ? "rgba(214,229,255,0.92)" : "rgba(204,214,232,0.86)",
            fontSize: "24px",
            fontWeight: 600,
            marginRight: "14px",
          },
        },
        label
      ),
      el(
        "span",
        {
          style: {
            color: tone === "yes" ? "#56a0ff" : "#f2f7ff",
            fontSize: "42px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
          },
        },
        value
      )
    );

  return el(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "linear-gradient(180deg, #050814 0%, #02040b 100%)",
        padding: "36px",
        fontFamily: "sans-serif",
        color: "#f4f7ff",
      },
    },
    el(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: "30px",
          border: "1px solid rgba(76,110,190,0.45)",
          background: "linear-gradient(180deg, rgba(8,13,28,0.98) 0%, rgba(3,5,12,1) 100%)",
          padding: "42px 46px",
          position: "relative",
          overflow: "hidden",
        },
      },
      el("div", {
        style: {
          position: "absolute",
          inset: "0",
          display: "flex",
          background: "radial-gradient(circle at 50% 12%, rgba(31,108,240,0.18) 0%, rgba(0,0,0,0) 46%)",
        },
      }),
      el(
        "div",
        {
          style: {
            position: "relative",
            display: "flex",
            flexDirection: "column",
          },
        },
        brand,
        focus
          ? el(
              "div",
              {
                style: {
                  marginTop: "24px",
                  alignSelf: "flex-start",
                  display: "flex",
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid rgba(31,108,240,0.22)",
                  background: "rgba(31,108,240,0.08)",
                  color: "#8fb7ff",
                  fontSize: "18px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                },
              },
              focus
            )
          : null,
        el(
          "div",
          {
            style: {
              marginTop: focus ? "22px" : "34px",
              display: "flex",
              maxWidth: "1020px",
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: "-0.04em",
              color: "#f4f7ff",
            },
          },
          title
        )
      ),
      el(
        "div",
        {
          style: {
            position: "relative",
            display: "flex",
            flexDirection: "column",
          },
        },
        el(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
            },
          },
          pricePill(yesLabel, yesPrice, "yes"),
          pricePill(noLabel, noPrice, "no")
        ),
        el(
          "div",
          {
            style: {
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              color: "rgba(208,218,238,0.72)",
              fontSize: "22px",
              fontWeight: 500,
            },
          },
          el("span", null, meta),
          el("span", { style: { marginLeft: "26px" } }, close)
        )
      )
    )
  );
}

function getLegacyCard(searchParams) {
  const title = getParam(searchParams, "title", "Prediction Market");
  const yes = getParam(searchParams, "yes", "--");
  const no = getParam(searchParams, "no", "--");

  return el(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#0c1222",
        color: "#ffffff",
        fontFamily: "sans-serif",
        padding: "56px",
      },
    },
    el(
      "div",
      {
        style: {
          display: "flex",
          maxWidth: "980px",
          textAlign: "center",
          fontSize: title.length > 80 ? "44px" : "56px",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
        },
      },
      title
    ),
    el(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          marginTop: "28px",
        },
      },
      el(
        "div",
        {
          style: {
            minWidth: "220px",
            padding: "22px 26px",
            marginRight: "16px",
            borderRadius: "24px",
            background: "rgba(31,108,240,0.18)",
            border: "1px solid rgba(189,213,255,0.28)",
            display: "flex",
            flexDirection: "column",
          },
        },
        el("span", { style: { color: "#bdd5ff", fontSize: "18px", fontWeight: 700, textTransform: "uppercase" } }, "Yes"),
        el("span", { style: { marginTop: "8px", color: "#ffffff", fontSize: "42px", fontWeight: 800 } }, yes)
      ),
      el(
        "div",
        {
          style: {
            minWidth: "220px",
            padding: "22px 26px",
            borderRadius: "24px",
            background: "rgba(255,93,93,0.12)",
            border: "1px solid rgba(255,208,208,0.32)",
            display: "flex",
            flexDirection: "column",
          },
        },
        el("span", { style: { color: "#ffb6b6", fontSize: "18px", fontWeight: 700, textTransform: "uppercase" } }, "No"),
        el("span", { style: { marginTop: "8px", color: "#ffffff", fontSize: "42px", fontWeight: 800 } }, no)
      )
    )
  );
}

export default async function handler(request) {
  const { searchParams } = getRequestUrl(request);
  const theme = getTheme(searchParams);
  const element = theme === "bayse" ? getBayseCard(searchParams) : getLegacyCard(searchParams);

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
