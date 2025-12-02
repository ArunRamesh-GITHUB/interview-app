import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

  // Expose functions IMMEDIATELY on window load (not just in useEffect)
  // This ensures they're available as soon as possible
  if (typeof window !== 'undefined') {
    // Expose update function for direct JavaScript injection - THIS IS THE MAIN METHOD
    const updateTokens = (tokens: number) => {
      console.log(`💰💰💰💰💰 DIRECT TOKEN UPDATE CALLED: +${tokens} tokens`);
      setBalance((prev: number | null) => {
        const newBalance = (prev || 0) + tokens;
        console.log(`💰💰💰💰💰 Token balance updated: ${prev || 0} → ${newBalance} (+${tokens})`);
        return newBalance;
      });
    };
    
    // Expose refresh function as well
    const refreshTokens = () => {
      console.log('🔄🔄🔄 Refreshing tokens from server...');
      refresh();
    };
    
    (window as any).__TOKEN_PROVIDER_UPDATE__ = updateTokens;
    (window as any).__REFRESH_TOKENS__ = refreshTokens;
  }

  // Listen for purchase completion messages from mobile app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're in a React Native WebView
    const isWebView = !!(window as any).ReactNativeWebView;
    if (!isWebView) {
      console.log('📱 Not in WebView, skipping purchase message listener');
      return;
    }

    console.log('📱 Setting up purchase completion listener...');

    // Expose update function for direct JavaScript injection - THIS IS THE MAIN METHOD
    const updateTokens = (tokens: number) => {
      console.log(`💰💰💰💰💰 DIRECT TOKEN UPDATE CALLED: +${tokens} tokens`);
      setBalance((prev: number | null) => {
        const newBalance = (prev || 0) + tokens;
        console.log(`💰💰💰💰💰 Token balance updated: ${prev || 0} → ${newBalance} (+${tokens})`);
        return newBalance;
      });
    };
    
    // Expose refresh function as well
    const refreshTokens = () => {
      console.log('🔄🔄🔄 Refreshing tokens from server...');
      refresh();
    };
    
    (window as any).__TOKEN_PROVIDER_UPDATE__ = updateTokens;
    (window as any).__REFRESH_TOKENS__ = refreshTokens;
    console.log('✅✅✅ Exposed __TOKEN_PROVIDER_UPDATE__ and __REFRESH_TOKENS__ functions');
    console.log('✅✅✅ Functions available:', {
      update: typeof (window as any).__TOKEN_PROVIDER_UPDATE__,
      refresh: typeof (window as any).__REFRESH_TOKENS__
    });

    const handleCustomEvent = (event: CustomEvent) => {
      if (event.detail?.tokens && event.detail?.isTestProduct) {
        console.log(`💰 Custom event received: +${event.detail.tokens} tokens`);
        updateTokens(event.detail.tokens);
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'purchase_tokens' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.tokens) {
            console.log(`💰 Storage event received: +${data.tokens} tokens`);
            updateTokens(data.tokens);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    };

    // Listen for custom purchaseCompleted events
    window.addEventListener('purchaseCompleted', handleCustomEvent as EventListener);
    // Listen for storage events
    window.addEventListener('storage', handleStorageEvent);
    
    // Also poll localStorage as a fallback - MORE AGGRESSIVE POLLING
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('purchase_tokens');
        if (stored) {
          const data = JSON.parse(stored);
          // Only process if recent (within last 30 seconds - longer window)
          if (data.timestamp && Date.now() - data.timestamp < 30000 && data.tokens) {
            console.log(`💰💰💰💰💰 Polled localStorage: +${data.tokens} tokens (age: ${Math.round((Date.now() - data.timestamp) / 1000)}s)`);
            updateTokens(data.tokens);
            localStorage.removeItem('purchase_tokens'); // Clear after processing
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }, 500); // Poll every 500ms instead of 1000ms for faster response
    
    return () => {
      window.removeEventListener('purchaseCompleted', handleCustomEvent as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollInterval);
      delete (window as any).__TOKEN_PROVIDER_UPDATE__;
    };
  }, [refresh]);

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