(function attachHeadlineBagsClient(global) {
  const SOL_MINT = "So11111111111111111111111111111111111111112";

  function toBinaryString(bytes) {
    let output = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      output += String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize));
    }
    return output;
  }

  function bytesToBase64(bytes) {
    return btoa(toBinaryString(bytes));
  }

  function base64ToBytes(base64Value) {
    const binary = atob(base64Value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function deserializeTransaction(base64Value) {
    const bytes = base64ToBytes(base64Value);
    try {
      return global.solanaWeb3.VersionedTransaction.deserialize(bytes);
    } catch (error) {
      return global.solanaWeb3.Transaction.from(bytes);
    }
  }

  function serializeTransactionToBase64(transaction) {
    return bytesToBase64(transaction.serialize());
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || "Request failed");
    }
    return payload;
  }

  async function signTransactions(provider, serializedTransactions) {
    const transactions = serializedTransactions.map((item) => deserializeTransaction(item.base64 || item));

    if (typeof provider.signAllTransactions === "function") {
      const signed = await provider.signAllTransactions(transactions);
      return signed.map((transaction) => serializeTransactionToBase64(transaction));
    }

    const signedTransactions = [];
    for (const transaction of transactions) {
      if (typeof provider.signTransaction !== "function") {
        throw new Error("This wallet does not support transaction signing");
      }
      const signed = await provider.signTransaction(transaction);
      signedTransactions.push(serializeTransactionToBase64(signed));
    }
    return signedTransactions;
  }

  async function prepareLaunch(payload) {
    return requestJson("/api/bags/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function submitLaunch(payload) {
    return requestJson("/api/bags/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function launchToken(params) {
    const { provider, headline, kalshiOdds, userWallet, ticker } = params;
    const prepared = await prepareLaunch({ headline, kalshiOdds, userWallet, ticker });
    const signedTransactions = await signTransactions(provider, prepared.transactions || []);
    const submitted = await submitLaunch({
      signedTransactions,
      tokenMint: prepared.tokenMint,
      symbol: prepared.symbol,
      name: prepared.name,
      headline: prepared.headline,
      description: prepared.description,
      kalshiOdds: prepared.kalshiOdds,
      userWallet,
      metadataUrl: prepared.metadataUrl,
      configKey: prepared.configKey,
      imageUrl: prepared.imageUrl,
    });
    return { prepared, submitted };
  }

  async function getTokens() {
    return requestJson("/api/bags/tokens");
  }

  async function getQuote(params) {
    const query = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: String(params.amount),
    });
    return requestJson(`/api/bags/quote?${query.toString()}`);
  }

  async function prepareSwap(params) {
    return requestJson("/api/bags/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  }

  async function executePreparedSwap(provider, preparedSwap) {
    const transaction = deserializeTransaction(preparedSwap.transactionBase64);
    if (typeof provider.signAndSendTransaction !== "function") {
      throw new Error("This wallet does not support signAndSendTransaction");
    }
    const result = await provider.signAndSendTransaction(transaction);
    return {
      signature: result.signature || result,
      quote: preparedSwap.quote,
    };
  }

  global.HeadlineBagsClient = {
    SOL_MINT,
    deserializeTransaction,
    executePreparedSwap,
    getQuote,
    getTokens,
    launchToken,
    prepareLaunch,
    prepareSwap,
    requestJson,
    serializeTransactionToBase64,
    signTransactions,
    submitLaunch,
  };
})(window);
