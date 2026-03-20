const SOURCE_LOGOS = {
  NPR: "https://www.google.com/s2/favicons?domain=npr.org&sz=64",
  CNN: "https://www.google.com/s2/favicons?domain=cnn.com&sz=64",
  "Fox News": "https://www.google.com/s2/favicons?domain=foxnews.com&sz=64",
  "NY Times": "https://www.google.com/s2/favicons?domain=nytimes.com&sz=64",
  "Wash Post": "https://www.google.com/s2/favicons?domain=washingtonpost.com&sz=64",
  Reuters: "https://www.google.com/s2/favicons?domain=reuters.com&sz=64",
  BBC: "https://www.google.com/s2/favicons?domain=bbc.co.uk&sz=64",
  Cointelegraph: "https://www.google.com/s2/favicons?domain=cointelegraph.com&sz=64",
  CoinDesk: "https://www.google.com/s2/favicons?domain=coindesk.com&sz=64",
  "NPR Politics": "https://www.google.com/s2/favicons?domain=npr.org&sz=64",
  ESPN: "https://www.google.com/s2/favicons?domain=espn.com&sz=64",
  "CNN Sports": "https://www.google.com/s2/favicons?domain=cnn.com&sz=64",
  Bloomberg: "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=64",
  "Fox Business": "https://www.google.com/s2/favicons?domain=foxbusiness.com&sz=64",
};

const SOL_MINT = window.HeadlineBagsClient.SOL_MINT;
const WALLET_STORAGE_KEY = "headline-odds-wallet";

const state = {
  provider: null,
  walletAddress: null,
  trendResults: [],
  searchResults: [],
  searchHeadline: "",
  launchedTokens: [],
  launchDraft: null,
  swap: {
    token: null,
    side: "buy",
    quote: null,
    quoteTimer: null,
  },
  walletListenersBound: false,
};

const dom = {
  navWalletBtn: document.getElementById("navWalletBtn"),
  headlineInput: document.getElementById("headlineInput"),
  searchBtn: document.getElementById("searchBtn"),
  resultsArea: document.getElementById("resultsArea"),
  trendResults: document.getElementById("trendResults"),
  trendCount: document.getElementById("trendCount"),
  refreshBtn: document.getElementById("refreshBtn"),
  tickerWrap: document.getElementById("tickerWrap"),
  tickerInner: document.getElementById("tickerInner"),
  bagsTickerWrap: document.getElementById("bagsTickerWrap"),
  bagsTickerInner: document.getElementById("bagsTickerInner"),
  bagsTokenGrid: document.getElementById("bagsTokenGrid"),
  bagsSectionCount: document.getElementById("bagsSectionCount"),
  launchOverlay: document.getElementById("launchOverlay"),
  launchNameField: document.getElementById("launchNameField"),
  launchTickerField: document.getElementById("launchTickerField"),
  launchDescriptionField: document.getElementById("launchDescriptionField"),
  launchHeadlinePreview: document.getElementById("launchHeadlinePreview"),
  launchOddsContext: document.getElementById("launchOddsContext"),
  launchMarketPreview: document.getElementById("launchMarketPreview"),
  launchMarketLink: document.getElementById("launchMarketLink"),
  launchArtMark: document.getElementById("launchArtMark"),
  launchSourceBadge: document.getElementById("launchSourceBadge"),
  launchWalletBtn: document.getElementById("launchWalletBtn"),
  launchCreatorWallet: document.getElementById("launchCreatorWallet"),
  launchInitialBuyField: document.getElementById("launchInitialBuyField"),
  launchOwnershipNote: document.getElementById("launchOwnershipNote"),
  launchPresetBtns: document.querySelectorAll("[data-launch-buy]"),
  launchConfirmBtn: document.getElementById("launchConfirmBtn"),
  launchStatus: document.getElementById("launchStatus"),
  launchSuccess: document.getElementById("launchSuccess"),
  launchCloseBtns: document.querySelectorAll("[data-close-launch]"),
  swapOverlay: document.getElementById("swapOverlay"),
  swapWalletBtn: document.getElementById("swapWalletBtn"),
  swapModeBadge: document.getElementById("swapModeBadge"),
  swapTokenSymbol: document.getElementById("swapTokenSymbol"),
  swapTokenHeadline: document.getElementById("swapTokenHeadline"),
  swapOddsContext: document.getElementById("swapOddsContext"),
  swapMintLink: document.getElementById("swapMintLink"),
  swapInputLabel: document.getElementById("swapInputLabel"),
  swapInputAmount: document.getElementById("swapInputAmount"),
  swapInputTicker: document.getElementById("swapInputTicker"),
  swapOutputTicker: document.getElementById("swapOutputTicker"),
  quoteBox: document.getElementById("quoteBox"),
  quoteMeta: document.getElementById("quoteMeta"),
  priceImpact: document.getElementById("priceImpact"),
  routeVenue: document.getElementById("routeVenue"),
  feeNote: document.getElementById("feeNote"),
  swapExecBtn: document.getElementById("swapExecBtn"),
  swapStatus: document.getElementById("swapStatus"),
  swapCloseBtns: document.querySelectorAll("[data-close-swap]"),
  toastHost: document.getElementById("toastHost"),
};

function esc(value) {
  const node = document.createElement("div");
  node.textContent = value == null ? "" : String(value);
  return node.innerHTML;
}

function truncateAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function parseKalshiOddsValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveKalshiOdds(yesValue, noValue) {
  let yes = parseKalshiOddsValue(yesValue);
  let no = parseKalshiOddsValue(noValue);

  if (yes == null && no != null) {
    yes = Math.max(0, 100 - no);
  }

  if (no == null && yes != null) {
    no = Math.max(0, 100 - yes);
  }

  return { yes, no };
}

function formatKalshiSide(value, side) {
  const numeric = parseKalshiOddsValue(value);
  return numeric != null ? `${Math.round(numeric)}% ${side}` : "Quote pending";
}

function formatKalshiSnapshot(value) {
  const numeric = parseKalshiOddsValue(value);
  return numeric != null ? `${Math.round(numeric)}% YES` : "Snapshot unavailable";
}

function formatKalshiTickerValue(value) {
  const numeric = parseKalshiOddsValue(value);
  return numeric != null ? `${Math.round(numeric)}% YES` : "Quote pending";
}

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  if (numeric >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(numeric);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: numeric < 1 ? 4 : 2,
    maximumFractionDigits: numeric < 1 ? 6 : 2,
  }).format(numeric);
}

function formatPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}%`;
}

function formatTokenAmount(value, decimals) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numeric);
}

function deriveSuggestedTicker(headline) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
  ]);

  const words = String(headline || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word.toLowerCase()));

  let ticker = words
    .slice(0, 6)
    .map((word) => word[0])
    .join("");

  for (const char of words.join("")) {
    if (ticker.length >= 6) break;
    ticker += char;
  }

  if (ticker.length < 4) {
    ticker = (ticker + "NEWS").slice(0, 4);
  }

  return ticker.slice(0, 6);
}

function buildLaunchName(headline) {
  return String(headline || "").trim().slice(0, 20).trim() || "Headline Token";
}

function buildLaunchDescription(headline, kalshiOdds) {
  const odds = parseKalshiOddsValue(kalshiOdds);
  const oddsLabel = odds != null ? `${Math.round(odds)}% YES` : "N/A";
  return `${String(headline || "").trim()} | Kalshi odds: ${oddsLabel}`;
}

function cleanTickerInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function getLaunchInitialBuySol() {
  const numeric = Number(dom.launchInitialBuyField.value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function formatSolAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastHost.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

function getWalletProvider() {
  if (window.solana?.isPhantom) return window.solana;
  if (window.solflare?.isSolflare) return window.solflare;
  if (window.solana?.isSolflare) return window.solana;
  return window.solana || window.solflare || null;
}

function bindWalletListeners(provider) {
  if (!provider || state.walletListenersBound || typeof provider.on !== "function") {
    return;
  }

  provider.on("disconnect", () => {
    state.walletAddress = null;
    localStorage.removeItem(WALLET_STORAGE_KEY);
    updateWalletButtons();
  });

  provider.on("accountChanged", (publicKey) => {
    state.walletAddress = publicKey ? publicKey.toString() : null;
    if (state.walletAddress) {
      localStorage.setItem(WALLET_STORAGE_KEY, state.walletAddress);
    } else {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
    updateWalletButtons();
  });

  state.walletListenersBound = true;
}

function syncLaunchComposer() {
  const fallbackTicker = state.launchDraft?.headline
    ? deriveSuggestedTicker(state.launchDraft.headline)
    : "NEWS";
  const typedTicker = cleanTickerInput(dom.launchTickerField.value);
  if (dom.launchTickerField.value !== typedTicker) {
    dom.launchTickerField.value = typedTicker;
  }

  dom.launchArtMark.textContent = typedTicker || fallbackTicker;

  const sourceParts = [];
  if (state.launchDraft?.source) {
    sourceParts.push(state.launchDraft.source);
  }
  if (state.launchDraft?.similarity) {
    sourceParts.push(`${state.launchDraft.similarity}% match`);
  }
  dom.launchSourceBadge.textContent = sourceParts.join(" / ") || "Kalshi-linked launch";

  dom.launchCreatorWallet.textContent = state.walletAddress || "No wallet connected";
  dom.launchCreatorWallet.classList.toggle("is-connected", Boolean(state.walletAddress));

  const initialBuySol = getLaunchInitialBuySol();
  dom.launchOwnershipNote.textContent = initialBuySol > 0
    ? `${formatSolAmount(initialBuySol)} SOL will be included as the optional initial buy at launch. Keep extra SOL for network fees.`
    : "0 SOL launches the token without buying upfront. Keep extra SOL for network fees.";

  dom.launchPresetBtns.forEach((button) => {
    const presetValue = Number(button.dataset.launchBuy);
    const isActive = Math.abs(presetValue - initialBuySol) < 0.000001;
    button.classList.toggle("is-active", isActive);
  });
}

function updateWalletButtons() {
  const label = state.walletAddress ? truncateAddress(state.walletAddress) : "Connect Wallet";
  const buttons = [dom.navWalletBtn, dom.launchWalletBtn, dom.swapWalletBtn];

  buttons.forEach((button) => {
    if (!button) return;
    button.textContent = state.walletAddress ? label : button.dataset.defaultLabel || "Connect Wallet";
    button.classList.toggle("is-connected", Boolean(state.walletAddress));
  });

  dom.launchConfirmBtn.disabled = !state.launchDraft;
  if (!state.launchDraft) {
    dom.launchConfirmBtn.textContent = "Select a headline";
  } else {
    dom.launchConfirmBtn.textContent = "launch";
  }

  syncLaunchComposer();

  const hasSwapAmount = Number(dom.swapInputAmount.value) > 0;
  dom.swapExecBtn.disabled = !hasSwapAmount;
  dom.swapExecBtn.textContent = state.walletAddress ? "Swap" : "Connect wallet to swap";
}

async function connectWallet(options = {}) {
  const provider = getWalletProvider();
  if (!provider) {
    showToast("Install Phantom or Solflare to continue", "error");
    return null;
  }

  state.provider = provider;
  bindWalletListeners(provider);

  try {
    const connectionOptions = options.silent ? { onlyIfTrusted: true } : undefined;
    const response = await provider.connect(connectionOptions);
    state.walletAddress = response.publicKey.toString();
    localStorage.setItem(WALLET_STORAGE_KEY, state.walletAddress);
    updateWalletButtons();
    return state.walletAddress;
  } catch (error) {
    if (!options.silent) {
      showToast(error.message || "Wallet connection failed", "error");
    }
    return null;
  }
}

function buildTweetUrl(title, yesOdds, volume, closeDate, url) {
  const normalizedYes = parseKalshiOddsValue(yesOdds);
  const shareParams = new URLSearchParams({
    title,
    yes: normalizedYes == null ? "--" : String(Math.round(normalizedYes)),
    no: normalizedYes == null ? "--" : String(Math.round(100 - normalizedYes)),
    vol: volume || "",
    closes: closeDate || "",
    url,
  });
  const shareLink = `${window.location.origin}/api/share?${shareParams.toString()}`;
  const oddsLabel = normalizedYes == null ? "quote pending" : `${Math.round(normalizedYes)}%`;
  const tweetText = `Kalshi has this headline at ${oddsLabel} YES: ${title}\n\nWhat do you think?\n\nvia @headlineodds`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`;
}

function renderLiveTicker(results) {
  const items = results
    .map((item) => ({ ...item, resolvedOdds: resolveKalshiOdds(item.market?.yes_bid, item.market?.no_bid) }))
    .filter((item) => item.resolvedOdds.yes != null)
    .slice(0, 8);
  if (!items.length) {
    dom.tickerWrap.hidden = true;
    return;
  }

  const html = items
    .map((item) => {
      const title = item.market.title.length > 64
        ? `${item.market.title.slice(0, 64)}...`
        : item.market.title;
      return `
        <div class="ticker-item">
          <span class="ticker-title">${esc(title)}</span>
          <span class="ticker-sep"></span>
          <span class="ticker-yes">${esc(formatKalshiTickerValue(item.resolvedOdds.yes))}</span>
        </div>
      `;
    })
    .join("");

  dom.tickerInner.innerHTML = `${html}${html}`;
  dom.tickerWrap.hidden = false;
}

function sortByOddsPresence(items, getMarket) {
  return [...items].sort((left, right) => {
    const leftOdds = resolveKalshiOdds(getMarket(left)?.yes_bid, getMarket(left)?.no_bid);
    const rightOdds = resolveKalshiOdds(getMarket(right)?.yes_bid, getMarket(right)?.no_bid);
    const leftScore = Number(leftOdds.yes != null) + Number(leftOdds.no != null);
    const rightScore = Number(rightOdds.yes != null) + Number(rightOdds.no != null);
    return rightScore - leftScore;
  });
}

function renderSearchResults(results, headline) {
  state.searchResults = sortByOddsPresence(results, (item) => item);
  state.searchHeadline = headline;

  if (!state.searchResults.length) {
    dom.resultsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">No match</div>
        <p>No matching Kalshi markets showed up for that headline. Try a broader phrase.</p>
      </div>
    `;
    return;
  }

  const cards = state.searchResults
    .map((market, index) => renderMarketCard({
      type: "search",
      index,
      headline,
      source: "Search",
      similarity: market.similarity,
      market,
    }))
    .join("");

  dom.resultsArea.innerHTML = `
    <section class="panel-section">
      <div class="section-header">
        <div>
          <p class="section-kicker">Matched Markets</p>
          <h2 class="section-title">Scanner Results</h2>
        </div>
        <span class="section-meta">${state.searchResults.length} matches</span>
      </div>
      <div class="cards-grid">${cards}</div>
    </section>
  `;
}

function renderMarketCard(item) {
  const { type, index, headline, source, similarity, market } = item;
  const odds = resolveKalshiOdds(market.yes_bid, market.no_bid);
  const yesOdds = odds.yes;
  const noOdds = odds.no;
  const volume = market.volume != null
    ? formatMoney(Math.round(Number(market.volume) * ((Number(market.last_price) || Number(yesOdds) || 50) / 100)))
    : market.vol || "--";
  const closeDate = market.close_time
    ? new Date(market.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : market.close || "--";
  const tweetUrl = buildTweetUrl(market.title, yesOdds, volume, closeDate, market.url);
  const sourceLogo = SOURCE_LOGOS[source] || "https://via.placeholder.com/24x24/13151a/ffffff?text=H";

  return `
    <article class="market-card" data-card-type="${esc(type)}" data-card-index="${index}">
      <div class="market-card-top">
        <div class="source-chip">
          <img src="${sourceLogo}" alt="${esc(source)}" />
          <span>${esc(source)}</span>
        </div>
        ${similarity ? `<span class="match-pill">${esc(similarity)}% match</span>` : ""}
      </div>
      <p class="headline-quote">"${esc(headline)}"</p>
      <h3 class="market-card-title">${esc(market.title)}</h3>
      ${market.subtitle ? `<p class="market-subtitle">${esc(market.subtitle)}</p>` : ""}
      <div class="odds-row">
        <a class="odd-pill odd-pill-yes" href="${esc(market.url)}" target="_blank" rel="noopener">
          <span>Kalshi YES</span>
          <strong class="odds-value ${yesOdds == null ? "is-empty" : ""}">${esc(formatKalshiSide(yesOdds, "YES"))}</strong>
        </a>
        <a class="odd-pill odd-pill-no" href="${esc(market.url)}" target="_blank" rel="noopener">
          <span>Kalshi NO</span>
          <strong class="odds-value ${noOdds == null ? "is-empty" : ""}">${esc(formatKalshiSide(noOdds, "NO"))}</strong>
        </a>
      </div>
      <button class="launch-token-btn" data-launch-source="${esc(type)}" data-launch-index="${index}">
        Launch Token
      </button>
      <div class="market-meta">
        <span>Volume <strong>${esc(volume)}</strong></span>
        <span>Closes <strong>${esc(closeDate)}</strong></span>
      </div>
      <div class="market-actions">
        <a class="subtle-btn" href="${esc(tweetUrl)}" target="_blank" rel="noopener">Share to X</a>
        <a class="subtle-btn" href="${esc(market.url)}" target="_blank" rel="noopener">View on Kalshi</a>
      </div>
    </article>
  `;
}

function renderTrending(results) {
  state.trendResults = sortByOddsPresence(results, (item) => item.market);
  dom.trendCount.textContent = `${state.trendResults.length} matched headlines`;

  if (!state.trendResults.length) {
    dom.trendResults.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">Quiet tape</div>
        <p>No strong headline matches are live right now.</p>
      </div>
    `;
    return;
  }

  dom.trendResults.innerHTML = `
    <div class="cards-grid">
      ${state.trendResults.map((item, index) => renderMarketCard({
        type: "trend",
        index,
        headline: item.headline,
        source: item.source,
        similarity: item.similarity,
        market: item.market,
      })).join("")}
    </div>
  `;
}

function renderLaunchedTokens(tokens) {
  state.launchedTokens = tokens;
  dom.bagsSectionCount.textContent = `${tokens.length} launched`;

  if (!tokens.length) {
    dom.bagsTickerWrap.hidden = true;
    dom.bagsTokenGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">No launches yet</div>
        <p>Launch the first Bags token directly from a headline card and it will appear here.</p>
      </div>
    `;
    return;
  }

  const strip = tokens
    .map((token) => `
      <div class="bags-strip-item">
        <span class="token-mono token-symbol-inline">$${esc(token.symbol || "BAGS")}</span>
        <span class="token-price-inline">${esc(formatMoney(token.currentPriceUsd))}</span>
        <span class="token-change-inline ${Number(token.priceChange24h) >= 0 ? "is-up" : "is-down"}">
          ${esc(formatPercent(token.priceChange24h))}
        </span>
      </div>
    `)
    .join("");

  dom.bagsTickerInner.innerHTML = `${strip}${strip}`;
  dom.bagsTickerWrap.hidden = false;

  dom.bagsTokenGrid.innerHTML = `
    <div class="launched-grid">
      ${tokens.map((token, index) => `
        <article class="token-card">
          <div class="token-card-head">
            <div>
              <div class="token-mono token-symbol">$${esc(token.symbol || "BAGS")}</div>
              <p class="token-headline">${esc(token.headline || token.name || "Headline token")}</p>
            </div>
            <a class="token-link" href="${esc(token.bagsUrl || "https://bags.fm")}" target="_blank" rel="noopener">bags.fm</a>
          </div>
          <div class="token-stats">
            <div class="stat-block">
              <span class="stat-label">Kalshi</span>
              <strong class="token-kalshi token-mono ${parseKalshiOddsValue(token.kalshiOdds) == null ? "is-muted" : ""}">${esc(formatKalshiSnapshot(token.kalshiOdds))}</strong>
            </div>
            <div class="stat-block">
              <span class="stat-label">Price</span>
              <strong class="token-mono">${esc(formatMoney(token.currentPriceUsd))}</strong>
            </div>
            <div class="stat-block">
              <span class="stat-label">24h Volume</span>
              <strong class="token-mono">${esc(formatMoney(token.volume24hUsd))}</strong>
            </div>
            <div class="stat-block">
              <span class="stat-label">24h Change</span>
              <strong class="token-mono ${Number(token.priceChange24h) >= 0 ? "is-up" : "is-down"}">${esc(formatPercent(token.priceChange24h))}</strong>
            </div>
          </div>
          <div class="token-card-actions">
            <button class="buy-btn" data-swap-side="buy" data-token-index="${index}">BUY</button>
            <button class="sell-btn" data-swap-side="sell" data-token-index="${index}">SELL</button>
          </div>
          <div class="token-card-foot">
            <span class="mint-copy">Mint ${esc(truncateAddress(token.tokenMint))}</span>
            ${token.launchSignature ? `<a class="subtle-link" href="https://solscan.io/tx/${esc(token.launchSignature)}" target="_blank" rel="noopener">Launch tx</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

async function loadTrending(force = false) {
  dom.refreshBtn.disabled = true;
  dom.trendResults.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading trending headlines...</p>
    </div>
  `;

  try {
    const url = force ? "/api/trending?force=1&limit=20" : "/api/trending?limit=20";
    const response = await fetch(url);
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Unable to load trending headlines");
    }
    renderTrending(payload.results || []);
    renderLiveTicker(payload.results || []);
  } catch (error) {
    dom.trendResults.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">Trending unavailable</div>
        <p>${esc(error.message || "Unable to load trending headlines")}</p>
      </div>
    `;
  } finally {
    dom.refreshBtn.disabled = false;
  }
}

async function searchMarkets() {
  const headline = dom.headlineInput.value.trim();
  if (headline.length < 5) {
    showToast("Paste a longer headline first", "error");
    return;
  }

  dom.searchBtn.disabled = true;
  dom.searchBtn.textContent = "Scanning...";
  dom.resultsArea.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Scanning live Kalshi markets...</p>
    </div>
  `;

  try {
    const response = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      throw new Error(payload.error || "Search failed");
    }
    renderSearchResults(payload.results || [], headline);
  } catch (error) {
    dom.resultsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">Search failed</div>
        <p>${esc(error.message || "Unable to search right now")}</p>
      </div>
    `;
  } finally {
    dom.searchBtn.disabled = false;
    dom.searchBtn.textContent = "Find Markets";
  }
}

async function loadLaunchedTokens() {
  try {
    const payload = await window.HeadlineBagsClient.getTokens();
    renderLaunchedTokens(payload.tokens || []);
  } catch (error) {
    dom.bagsTickerWrap.hidden = true;
    dom.bagsTokenGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">Launch panel offline</div>
        <p>${esc(error.message || "Unable to load launched tokens")}</p>
      </div>
    `;
  }
}

function getLaunchSourceItem(source, index) {
  if (source === "trend") {
    return state.trendResults[index] || null;
  }
  if (source === "search") {
    const market = state.searchResults[index] || null;
    return {
      headline: state.searchHeadline,
      source: "Search result",
      similarity: market?.similarity,
      market,
    };
  }
  return null;
}

function clearLaunchFeedback() {
  dom.launchStatus.innerHTML = "";
  dom.launchStatus.className = "status-box";
  dom.launchStatus.hidden = true;
  dom.launchSuccess.hidden = true;
  dom.launchSuccess.innerHTML = "";
}

function openLaunchModal(payload) {
  state.launchDraft = payload;
  dom.launchNameField.value = buildLaunchName(payload.headline);
  dom.launchTickerField.value = deriveSuggestedTicker(payload.headline);
  dom.launchDescriptionField.value = buildLaunchDescription(payload.headline, payload.kalshiOdds);
  dom.launchHeadlinePreview.textContent = payload.headline;
  dom.launchOddsContext.textContent = formatKalshiSnapshot(payload.kalshiOdds);
  dom.launchMarketPreview.textContent = payload.marketTitle || "Matched market details will appear here.";
  dom.launchMarketLink.hidden = !payload.marketUrl;
  if (payload.marketUrl) {
    dom.launchMarketLink.href = payload.marketUrl;
  }
  dom.launchInitialBuyField.value = "0";
  clearLaunchFeedback();
  syncLaunchComposer();
  updateWalletButtons();
  dom.launchOverlay.hidden = false;
  document.body.classList.add("modal-open");
  dom.launchNameField.focus();
}

function closeLaunchModal() {
  dom.launchOverlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function setLaunchStatus(message, type) {
  dom.launchStatus.className = `status-box status-${type}`;
  dom.launchStatus.innerHTML = message;
  dom.launchStatus.hidden = false;
}

async function submitLaunch() {
  if (!state.launchDraft) return;
  const walletAddress = state.walletAddress || (await connectWallet());
  if (!walletAddress) return;

  const ticker = cleanTickerInput(dom.launchTickerField.value);
  const headline = state.launchDraft.headline?.trim();
  const name = dom.launchNameField.value.trim();
  const description = dom.launchDescriptionField.value.trim();
  const initialBuySol = Number(dom.launchInitialBuyField.value);

  dom.launchTickerField.value = ticker;
  syncLaunchComposer();

  if (!headline || headline.length < 5) {
    setLaunchStatus("Use a longer headline before launching.", "error");
    return;
  }

  if (!name) {
    setLaunchStatus("Add a token name before launching.", "error");
    return;
  }

  if (ticker.length < 4) {
    setLaunchStatus("Ticker must be 4 to 6 characters.", "error");
    return;
  }

  if (!description) {
    setLaunchStatus("Add a description before launching.", "error");
    return;
  }

  if (!Number.isFinite(initialBuySol) || initialBuySol < 0) {
    setLaunchStatus("Initial buy must be a non-negative SOL amount.", "error");
    return;
  }

  clearLaunchFeedback();
  dom.launchConfirmBtn.disabled = true;
  dom.launchConfirmBtn.textContent = "Preparing launch...";

  try {
    const provider = state.provider || getWalletProvider();
    const result = await window.HeadlineBagsClient.launchToken({
      provider,
      headline,
      kalshiOdds: state.launchDraft.kalshiOdds,
      userWallet: walletAddress,
      ticker,
      name,
      description,
      initialBuyLamports: Math.round(initialBuySol * 1e9),
      onStatus(message) {
        setLaunchStatus(message, "progress");
        if (message.includes("sign")) {
          dom.launchConfirmBtn.textContent = "Awaiting signature...";
        } else if (message.includes("Broadcasting")) {
          dom.launchConfirmBtn.textContent = "Broadcasting...";
        } else {
          dom.launchConfirmBtn.textContent = "Preparing launch...";
        }
      },
    });

    dom.launchStatus.hidden = true;
    dom.launchSuccess.hidden = false;
    dom.launchSuccess.innerHTML = `
      <div class="success-line">$${esc(result.submitted.symbol || ticker)} launched for this headline.</div>
      <div class="success-mint token-mono">${esc(result.submitted.tokenMint)}</div>
      <div class="field-subcopy">Initial buy: ${esc(formatSolAmount(initialBuySol))} SOL</div>
      <div class="success-links">
        <a href="${esc(result.submitted.bagsUrl || "https://bags.fm")}" target="_blank" rel="noopener">Open Bags</a>
        ${result.submitted.txSignature ? `<a href="https://solscan.io/tx/${esc(result.submitted.txSignature)}" target="_blank" rel="noopener">View transaction</a>` : ""}
      </div>
    `;
    showToast("Token launched successfully", "success");
    await loadLaunchedTokens();
  } catch (error) {
    setLaunchStatus(error.message || "Launch failed", "error");
  } finally {
    updateWalletButtons();
  }
}

function clearSwapFeedback() {
  dom.swapStatus.innerHTML = "";
  dom.swapStatus.className = "status-box";
  dom.swapStatus.hidden = true;
}

function updateSwapModal() {
  const token = state.swap.token;
  if (!token) return;

  const isBuy = state.swap.side === "buy";
  dom.swapModeBadge.textContent = isBuy ? "BUY" : "SELL";
  dom.swapModeBadge.className = `mode-badge ${isBuy ? "mode-buy" : "mode-sell"}`;
  dom.swapTokenSymbol.textContent = `$${token.symbol || "BAGS"}`;
  dom.swapTokenHeadline.textContent = token.headline || token.name || "Headline token";
  dom.swapOddsContext.textContent = `Kalshi ${formatKalshiSnapshot(token.kalshiOdds)}`;
  dom.swapMintLink.textContent = truncateAddress(token.tokenMint);
  dom.swapMintLink.href = token.bagsUrl || "https://bags.fm";
  dom.swapInputLabel.textContent = isBuy ? "You pay in SOL" : `You sell in ${token.symbol || "token"}`;
  dom.swapInputTicker.textContent = isBuy ? "SOL" : token.symbol || "TOKEN";
  dom.swapOutputTicker.textContent = isBuy ? token.symbol || "TOKEN" : "SOL";
  dom.swapInputAmount.value = "";
  dom.quoteBox.innerHTML = "Enter an amount to request a Bags route.";
  dom.quoteMeta.hidden = true;
  state.swap.quote = null;
  clearSwapFeedback();
  updateWalletButtons();
}

function openSwapModal(index, side) {
  state.swap.token = state.launchedTokens[index] || null;
  state.swap.side = side;
  if (!state.swap.token) return;
  updateSwapModal();
  dom.swapOverlay.hidden = false;
  document.body.classList.add("modal-open");
}

function closeSwapModal() {
  dom.swapOverlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function getSwapInputDecimals() {
  return state.swap.side === "buy" ? 9 : (state.swap.token?.decimals || 6);
}

function getSwapOutputDecimals() {
  return state.swap.side === "buy" ? (state.swap.token?.decimals || 6) : 9;
}

function getSwapInputMint() {
  return state.swap.side === "buy" ? SOL_MINT : state.swap.token?.tokenMint;
}

function getSwapOutputMint() {
  return state.swap.side === "buy" ? state.swap.token?.tokenMint : SOL_MINT;
}

function getSmallestUnitAmount() {
  const amount = Number(dom.swapInputAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * (10 ** getSwapInputDecimals()));
}

async function requestSwapQuote() {
  if (!state.swap.token) return;

  const amount = getSmallestUnitAmount();
  if (!amount) {
    dom.quoteBox.innerHTML = "Enter an amount to request a Bags route.";
    dom.quoteMeta.hidden = true;
    dom.swapExecBtn.disabled = true;
    state.swap.quote = null;
    return;
  }

  dom.quoteBox.innerHTML = "Routing order...";
  dom.quoteMeta.hidden = true;

  try {
    const payload = await window.HeadlineBagsClient.getQuote({
      inputMint: getSwapInputMint(),
      outputMint: getSwapOutputMint(),
      amount,
    });

    state.swap.quote = payload.quote;
    const outputAmount = Number(payload.quote.outAmount) / (10 ** getSwapOutputDecimals());
    dom.quoteBox.innerHTML = `
      <strong class="quote-amount">${esc(formatTokenAmount(outputAmount, state.swap.side === "buy" ? 2 : 6))}</strong>
      <span class="quote-token">${esc(dom.swapOutputTicker.textContent)}</span>
    `;
    dom.priceImpact.textContent = payload.quote.priceImpactPct
      ? `${Number(payload.quote.priceImpactPct).toFixed(4)}%`
      : "<0.01%";
    dom.routeVenue.textContent = payload.quote.venue || "Bags";
    const feeBps = Number(payload.quote.platformFee?.feeBps);
    dom.feeNote.textContent = Number.isFinite(feeBps) && feeBps > 0
      ? `${(feeBps / 100).toFixed(2)}% via partner key`
      : "1% via partner key";
    dom.quoteMeta.hidden = false;
    dom.swapExecBtn.disabled = !state.walletAddress;
    dom.swapExecBtn.textContent = state.walletAddress ? "Swap" : "Connect wallet to swap";
  } catch (error) {
    dom.quoteBox.innerHTML = esc(error.message || "Quote failed");
    dom.quoteMeta.hidden = true;
    dom.swapExecBtn.disabled = true;
    state.swap.quote = null;
  }
}

async function submitSwap() {
  if (!state.swap.token) return;
  const walletAddress = state.walletAddress || (await connectWallet());
  if (!walletAddress) return;

  const amount = getSmallestUnitAmount();
  if (!amount) {
    clearSwapFeedback();
    dom.swapStatus.hidden = false;
    dom.swapStatus.className = "status-box status-error";
    dom.swapStatus.textContent = "Enter an amount before swapping.";
    return;
  }

  clearSwapFeedback();
  dom.swapExecBtn.disabled = true;
  dom.swapExecBtn.textContent = "Preparing swap...";

  try {
    const provider = state.provider || getWalletProvider();
    const prepared = await window.HeadlineBagsClient.prepareSwap({
      inputMint: getSwapInputMint(),
      outputMint: getSwapOutputMint(),
      amount,
      userPublicKey: walletAddress,
    });

    const result = await window.HeadlineBagsClient.executePreparedSwap(provider, prepared);
    dom.swapStatus.hidden = false;
    dom.swapStatus.className = "status-box status-success";
    dom.swapStatus.innerHTML = `Swap sent. <a href="https://solscan.io/tx/${esc(result.signature)}" target="_blank" rel="noopener">View on Solscan</a>`;
    showToast("Swap submitted", "success");
    await loadLaunchedTokens();
  } catch (error) {
    dom.swapStatus.hidden = false;
    dom.swapStatus.className = "status-box status-error";
    dom.swapStatus.textContent = error.message || "Swap failed";
  } finally {
    dom.swapExecBtn.disabled = false;
    dom.swapExecBtn.textContent = "Swap";
  }
}

function debounceSwapQuote() {
  clearTimeout(state.swap.quoteTimer);
  state.swap.quoteTimer = setTimeout(requestSwapQuote, 400);
}

function handleDocumentClick(event) {
  const launchButton = event.target.closest("[data-launch-source]");
  if (launchButton) {
    const item = getLaunchSourceItem(launchButton.dataset.launchSource, Number(launchButton.dataset.launchIndex));
    if (item?.market) {
      const launchOdds = resolveKalshiOdds(item.market.yes_bid, item.market.no_bid).yes;
      openLaunchModal({
        headline: item.headline,
        kalshiOdds: launchOdds,
        source: item.source,
        similarity: item.similarity,
        marketTitle: item.market.title,
        marketUrl: item.market.url,
      });
    }
    return;
  }

  const swapButton = event.target.closest("[data-swap-side]");
  if (swapButton) {
    openSwapModal(Number(swapButton.dataset.tokenIndex), swapButton.dataset.swapSide);
  }
}

function bindEvents() {
  dom.navWalletBtn.addEventListener("click", () => connectWallet());
  dom.launchWalletBtn.addEventListener("click", () => connectWallet());
  dom.swapWalletBtn.addEventListener("click", () => connectWallet());
  dom.searchBtn.addEventListener("click", searchMarkets);
  dom.headlineInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchMarkets();
  });
  dom.refreshBtn.addEventListener("click", () => loadTrending(true));
  dom.launchConfirmBtn.addEventListener("click", submitLaunch);
  dom.swapExecBtn.addEventListener("click", submitSwap);
  dom.launchTickerField.addEventListener("input", syncLaunchComposer);
  dom.launchInitialBuyField.addEventListener("input", syncLaunchComposer);
  dom.swapInputAmount.addEventListener("input", debounceSwapQuote);

  dom.launchPresetBtns.forEach((button) => {
    button.addEventListener("click", () => {
      dom.launchInitialBuyField.value = button.dataset.launchBuy || "0";
      syncLaunchComposer();
    });
  });

  dom.launchCloseBtns.forEach((button) => {
    button.addEventListener("click", closeLaunchModal);
  });

  dom.swapCloseBtns.forEach((button) => {
    button.addEventListener("click", closeSwapModal);
  });

  dom.launchOverlay.addEventListener("click", (event) => {
    if (event.target === dom.launchOverlay) closeLaunchModal();
  });

  dom.swapOverlay.addEventListener("click", (event) => {
    if (event.target === dom.swapOverlay) closeSwapModal();
  });

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeLaunchModal();
    closeSwapModal();
  });
}

async function init() {
  bindEvents();
  updateWalletButtons();
  dom.headlineInput.focus();

  if (localStorage.getItem(WALLET_STORAGE_KEY)) {
    await connectWallet({ silent: true });
  }

  await Promise.all([loadTrending(), loadLaunchedTokens()]);
  setInterval(loadTrending, 5 * 60 * 1000);
  setInterval(loadLaunchedTokens, 60 * 1000);
}

init();
