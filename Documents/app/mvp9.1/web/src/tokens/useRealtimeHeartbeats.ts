import { useEffect, useRef, useState } from "react";
import { useTokens } from "./TokenProvider";

/**
 * Start after WebRTC connects; stop on disconnect.
 * Server /start consumes upfront 1.5 tokens, then /beat bills every ~10s.
 */
export function useRealtimeHeartbeats() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const beatInterval = useRef<number | null>(null);
  const { refresh } = useTokens();

  const start = async () => {
    if (running) return;
    const r = await fetch("/api/realtime-meter/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "REALTIME" }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      throw new Error(j.error ?? "Failed to start realtime meter");
    }

    setSessionId(j.sessionId);
    setRunning(true);

    beatInterval.current = window.setInterval(async () => {
      try {
        const b = await fetch("/api/realtime-meter/beat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: j.sessionId }),
        });
        const bj = await b.json();
        if (!b.ok || bj?.error) throw new Error(bj?.error ?? "Beat failed");
      } catch (e) {
        console.warn("Realtime beat error:", e);
        await refresh();
        stop(); // stop metering — the page should also tear down the RT session
      }
    }, 10000);
  };

  const stop = async () => {
    if (beatInterval.current) window.clearInterval(beatInterval.current);
    beatInterval.current = null;
    setRunning(false);

    if (sessionId) {
      try {
        await fetch("/api/realtime-meter/stop", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch { /* ignore */ }
      setSessionId(null);
    }
  };

  useEffect(() => () => { if (beatInterval.current) window.clearInterval(beatInterval.current); }, []);

  return { running, sessionId, start, stop };
}