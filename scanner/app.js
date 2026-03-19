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
  launchHeadlineField: document.getElementById("launchHeadlineField"),
  launchTickerField: document.getElementById("launchTickerField"),
  launchOddsContext: document.getElementById("launchOddsContext"),
  launchWalletBtn: document.getElementById("launchWalletBtn"),
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

function formatOdds(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric)}% YES` : "--";
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
    dom.launchConfirmBtn.textContent = "Launch Token";
  }

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
  const shareParams = new URLSearchParams({
    title,
    yes: yesOdds == null ? "--" : String(yesOdds),
    no: yesOdds == null ? "--" : String(100 - Number(yesOdds)),
    vol: volume || "",
    closes: closeDate || "",
    url,
  });
  const shareLink = `${window.location.origin}/api/share?${shareParams.toString()}`;
  const oddsLabel = yesOdds == null ? "--" : `${Math.round(Number(yesOdds))}%`;
  const tweetText = `Kalshi has this headline at ${oddsLabel} YES: ${title}\n\nWhat do you think?\n\nvia @headlineodds`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareLink)}`;
}

function renderLiveTicker(results) {
  const items = results.filter((item) => item.market?.yes_bid != null).slice(0, 8);
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
          <span class="ticker-yes">${esc(formatOdds(item.market.yes_bid))}</span>
        </div>
      `;
    })
    .join("");

  dom.tickerInner.innerHTML = `${html}${html}`;
  dom.tickerWrap.hidden = false;
}

function renderSearchResults(results, headline) {
  state.searchResults = results;
  state.searchHeadline = headline;

  if (!results.length) {
    dom.resultsArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">No match</div>
        <p>No matching Kalshi markets showed up for that headline. Try a broader phrase.</p>
      </div>
    `;
    return;
  }

  const cards = results
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
        <span class="section-meta">${results.length} matches</span>
      </div>
      <div class="cards-grid">${cards}</div>
    </section>
  `;
}

function renderMarketCard(item) {
  const { type, index, headline, source, similarity, market } = item;
  const yesOdds = market.yes_bid;
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
          <strong>${esc(formatOdds(yesOdds))}</strong>
        </a>
        <a class="odd-pill odd-pill-no" href="${esc(market.url)}" target="_blank" rel="noopener">
          <span>Kalshi NO</span>
          <strong>${esc(formatOdds(100 - Number(yesOdds || 0)))}</strong>
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
  state.trendResults = results;
  dom.trendCount.textContent = `${results.length} matched headlines`;

  if (!results.length) {
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
      ${results.map((item, index) => renderMarketCard({
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
              <strong class="token-kalshi token-mono">${esc(formatOdds(token.kalshiOdds))}</strong>
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
    return {
      headline: state.searchHeadline,
      market: state.searchResults[index] || null,
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
  dom.launchHeadlineField.value = payload.headline;
  dom.launchTickerField.value = deriveSuggestedTicker(payload.headline);
  dom.launchOddsContext.textContent = `${formatOdds(payload.kalshiOdds)} on Kalshi`;
  clearLaunchFeedback();
  updateWalletButtons();
  dom.launchOverlay.hidden = false;
  document.body.classList.add("modal-open");
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

  const ticker = dom.launchTickerField.value.trim().toUpperCase();
  const headline = dom.launchHeadlineField.value.trim();
  if (headline.length < 5) {
    setLaunchStatus("Use a longer headline before launching.", "error");
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
    });

    dom.launchSuccess.hidden = false;
    dom.launchSuccess.innerHTML = `
      <div class="success-line">Token launched.</div>
      <div class="success-mint token-mono">${esc(result.submitted.tokenMint)}</div>
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
    dom.launchConfirmBtn.disabled = false;
    dom.launchConfirmBtn.textContent = "Launch Token";
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
  dom.swapOddsContext.textContent = `${formatOdds(token.kalshiOdds)} on Kalshi`;
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
      openLaunchModal({
        headline: item.headline,
        kalshiOdds: item.market.yes_bid,
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
  dom.swapInputAmount.addEventListener("input", debounceSwapQuote);

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
