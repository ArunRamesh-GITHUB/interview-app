import { useEffect, useRef, useState } from "react";
import { useTokens } from "./TokenProvider";

type PageKind = "DRILL" | "LIVE";

/**
 * Upfront 0.25 token on start (covers first 0–15s),
 * then 0.25 every subsequent 15s while running.
 * Includes a cooldown (default 3s) to prevent spam starts.
 */
export function usePracticeMeter(page: PageKind, opts?: { cooldownMs?: number }) {
  const { consumeOnce, balance, refresh } = useTokens();
  const [running, setRunning] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const cooldownMs = opts?.cooldownMs ?? 3000;

  const accSec = useRef(0);
  const timer = useRef<number | null>(null);

  const startCooldown = () => {
    setCoolingDown(true);
    window.setTimeout(() => setCoolingDown(false), cooldownMs);
  };

  const tick = async () => {
    accSec.current += 1;
    if (accSec.current >= 15) {
      accSec.current -= 15;
      try {
        await consumeOnce(page, 0.25, { kind: "practice_tick", seconds: 15 });
      } catch (e) {
        console.warn("Token consume (tick) failed:", e);
        stop();
        await refresh();
      }
    }
  };

  const start = async () => {
    if (running || coolingDown) return;
    try {
      // Upfront block covers the first 0–15s even if user stops early
      await consumeOnce(page, 0.25, { kind: "practice_start_block" });
    } catch (e) {
      console.warn("Upfront consume failed:", e);
      await refresh();
      return;
    }
    setRunning(true);
    startCooldown();
    accSec.current = 0;
    timer.current = window.setInterval(tick, 1000);
  };

  const pause = () => {
    if (!running) return;
    setRunning(false);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const resume = () => {
    if (running || coolingDown) return;
    setRunning(true);
    startCooldown();
    timer.current = window.setInterval(tick, 1000);
  };

  const stop = () => {
    setRunning(false);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    accSec.current = 0;
    startCooldown();
  };

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  return { running, coolingDown, balance, start, pause, resume, stop };
}