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