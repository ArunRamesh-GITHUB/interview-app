// Client-side token session management
export type Mode = "practice" | "realtime";

export interface TokenSessionInfo {
  sessionId: string;
  charged: number;
}

export interface TokenSessionResult {
  totalTokens: number;
  settledNow: number;
}

export async function fetchTokenBalance(): Promise<number> {
  const response = await fetch("/api/tokens/balance", { 
    credentials: "include" 
  });
  if (!response.ok) throw new Error("Failed to fetch balance");
  const data = await response.json();
  return Number(data.balanceTokens ?? 0);
}

export async function ensureTokens(min: number): Promise<{ ok: boolean; balance: number }> {
  const response = await fetch("/api/tokens/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ min }),
  });
  
  if (response.status === 402) {
    const data = await response.json();
    return { ok: false, balance: Number(data.balance ?? 0) };
  }
  
  if (!response.ok) throw new Error("Failed to ensure tokens");
  const data = await response.json();
  return { ok: true, balance: Number(data.balance ?? 0) };
}

export async function startTokenSession(mode: Mode): Promise<TokenSessionInfo> {
  const response = await fetch("/api/token-session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mode }),
  });
  
  if (response.status === 402) throw new Error("INSUFFICIENT_TOKENS");
  if (!response.ok) throw new Error("Failed to start token session");
  
  return response.json();
}

export async function stopTokenSession(
  sessionId: string, 
  durationMs: number
): Promise<TokenSessionResult> {
  const response = await fetch("/api/token-session/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId, durationMs }),
  });
  
  if (!response.ok) throw new Error("Failed to stop token session");
  return response.json();
}

// Utility class for managing token sessions in components
export class TokenSessionManager {
  private sessionId: string | null = null;
  private startTime: number | null = null;
  private mode: Mode;

  constructor(mode: Mode) {
    this.mode = mode;
  }

  async start(): Promise<TokenSessionInfo> {
    if (this.sessionId) {
      throw new Error("Session already active");
    }

    // Check minimum tokens required
    const minRequired = this.mode === "realtime" ? 1.5 : 0.25;
    const { ok } = await ensureTokens(minRequired);
    if (!ok) {
      throw new Error("INSUFFICIENT_TOKENS");
    }

    const sessionInfo = await startTokenSession(this.mode);
    this.sessionId = sessionInfo.sessionId;
    this.startTime = Date.now();
    
    return sessionInfo;
  }

  async stop(): Promise<TokenSessionResult> {
    if (!this.sessionId || !this.startTime) {
      throw new Error("No active session");
    }

    const durationMs = Date.now() - this.startTime;
    const result = await stopTokenSession(this.sessionId, durationMs);
    
    this.sessionId = null;
    this.startTime = null;
    
    return result;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isActive(): boolean {
    return this.sessionId !== null;
  }

  getDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }
}