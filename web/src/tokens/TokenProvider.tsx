import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";

type PageKey = "DRILL" | "LIVE" | "REALTIME";
type Ctx = {
  balance: number | null;
  refresh: () => Promise<void>;
  consumeOnce: (page: PageKey, amount: number, meta?: any) => Promise<number>;
};

const TokenCtx = createContext<Ctx | null>(null);

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/tokens/balance", { credentials: "include" });
      const j = await r.json();
      setBalance(j.balanceTokens ?? 0);
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      setBalance(0);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Track processed transactions to prevent duplicates
  const processedTransactions = useRef<Set<string>>(new Set());
  
  // Create stable update function using useCallback
  const updateTokens = useCallback((tokens: number, transactionId?: string) => {
    const txId = transactionId || `tx_${Date.now()}_${Math.random()}`;
    
    // Check if already processed
    if (processedTransactions.current.has(txId)) {
      console.log(`⚠️⚠️⚠️⚠️⚠️ Transaction already processed, skipping: ${txId}`);
      console.log(`⚠️⚠️⚠️⚠️⚠️ Current processed set:`, Array.from(processedTransactions.current));
      return;
    }
    
    // Mark as processed IMMEDIATELY before any async operations
    processedTransactions.current.add(txId);
    // Keep only last 100 transactions
    if (processedTransactions.current.size > 100) {
      const arr = Array.from(processedTransactions.current);
      processedTransactions.current = new Set(arr.slice(-100));
    }
    
    console.log(`💰💰💰💰💰 DIRECT TOKEN UPDATE CALLED: +${tokens} tokens (tx: ${txId})`);
    console.log(`💰💰💰💰💰 Processed transactions count: ${processedTransactions.current.size}`);
    setBalance((prev: number | null) => {
      const newBalance = (prev || 0) + tokens;
      console.log(`💰💰💰💰💰 Token balance updated: ${prev || 0} → ${newBalance} (+${tokens})`);
      return newBalance;
    });
  }, []);
  
  // Create stable refresh function
  const refreshTokens = useCallback(() => {
    console.log('🔄🔄🔄 Refreshing tokens from server...');
    refresh();
  }, [refresh]);

  // Expose functions to window - do this in useEffect to ensure it runs after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're in a React Native WebView
    const isWebView = !!(window as any).ReactNativeWebView;
    if (!isWebView) {
      console.log('📱 Not in WebView, skipping purchase message listener');
      return;
    }

    console.log('📱 Setting up purchase completion listener...');
    
    // Expose functions to window
    (window as any).__TOKEN_PROVIDER_UPDATE__ = updateTokens;
    (window as any).__REFRESH_TOKENS__ = refreshTokens;
    
    console.log('✅✅✅ Exposed __TOKEN_PROVIDER_UPDATE__ and __REFRESH_TOKENS__ functions');
    console.log('✅✅✅ Functions available:', {
      update: typeof (window as any).__TOKEN_PROVIDER_UPDATE__,
      refresh: typeof (window as any).__REFRESH_TOKENS__
    });
    
    return () => {
      delete (window as any).__TOKEN_PROVIDER_UPDATE__;
      delete (window as any).__REFRESH_TOKENS__;
    };
  }, [updateTokens, refreshTokens]);

  const consumeOnce = useCallback(async (page: PageKey, amount: number, meta?: any) => {
    // Use the existing token consumption endpoint which expects { kind, seconds, metadata }
    // For practice: 0.25 tokens should correspond to 15 seconds
    // For realtime: 1.5 tokens should correspond to 10 seconds
    const kind = page === "REALTIME" ? "realtime" : "practice";
    const seconds = kind === "realtime" ? 10 : 15; // Fixed duration per token charge
    
    console.log(`Token consumption: ${kind} for ${seconds} seconds (${amount} tokens requested)`);
    
    const r = await fetch("/api/tokens/consume", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, seconds, metadata: meta }),
    });
    const j = await r.json();
    if (!r.ok) {
      if (r.status === 402) throw new Error("INSUFFICIENT_TOKENS");
      throw new Error(j.error ?? "Token consume failed");
    }
    console.log(`Token consumption successful. New balance: ${j.newBalance}, Consumed: ${j.consumedTokens}`);
    setBalance(j.newBalance);
    return j.newBalance as number;
  }, []);

  return (
    <TokenCtx.Provider value={{ balance, refresh, consumeOnce }}>
      {children}
    </TokenCtx.Provider>
  );
};

export const useTokens = () => {
  const ctx = useContext(TokenCtx);
  if (!ctx) throw new Error("useTokens must be used inside <TokenProvider/>");
  return ctx;
};