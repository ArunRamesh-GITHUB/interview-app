import express from "express";
import { z } from "zod";
import crypto from "crypto";
import { spConsumeTokens } from "../db/tokens.js";

const router = express.Router();

// Auth middleware (assuming it exists in server.js)
function authRequired(req, res, next) { 
  if (req.session?.user?.id) {
    return next();
  } 
  return res.status(401).json({ error: 'Not authenticated' }) 
}

const sessions = new Map(); // sessionId -> { userId, page, lastBeatAtMs }

const StartSchema = z.object({ page: z.literal("REALTIME") });
const BeatSchema  = z.object({ sessionId: z.string() });
const StopSchema  = z.object({ sessionId: z.string() });

const TOKENS_PER_BEAT = 1.5;  // per 10s
const BEAT_SECONDS    = 10;

router.post("/start", authRequired, async (req, res) => {
  try {
    StartSchema.parse(req.body);

    // Upfront consume covering first 10s
    const { new_balance } = await spConsumeTokens({
      user_id: req.session.user.id,
      amount: TOKENS_PER_BEAT,
      reason: "METERED_REALTIME_START",
      meta: { kind: "realtime_start" },
    });

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      userId: req.session.user.id,
      page: "REALTIME",
      lastBeatAtMs: Date.now(),
    });

    return res.json({ ok: true, sessionId, beatSeconds: BEAT_SECONDS, tokensPerBeat: TOKENS_PER_BEAT, balance: new_balance });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ ok: false, error: e.message ?? "Bad request" });
  }
});

router.post("/beat", authRequired, async (req, res) => {
  try {
    const { sessionId } = BeatSchema.parse(req.body);
    const s = sessions.get(sessionId);
    if (!s) return res.status(404).json({ ok: false, error: "No session" });
    if (s.userId !== req.session.user.id) return res.status(403).json({ ok: false, error: "Forbidden" });

    const now = Date.now();
    const elapsedSec = (now - s.lastBeatAtMs) / 1000;

    if (elapsedSec < BEAT_SECONDS * 0.9) {
      return res.json({ ok: true, charged: false });
    }

    const { new_balance } = await spConsumeTokens({
      user_id: s.userId,
      amount: TOKENS_PER_BEAT,
      reason: "METERED_REALTIME_BEAT",
      meta: { kind: "heartbeat", elapsedSec: Math.floor(elapsedSec) },
    });

    s.lastBeatAtMs = now;
    return res.json({ ok: true, charged: true, balance: new_balance });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ ok: false, error: e.message ?? "Bad request" });
  }
});

router.post("/stop", authRequired, async (req, res) => {
  try {
    const { sessionId } = StopSchema.parse(req.body);
    const s = sessions.get(sessionId);
    if (s && s.userId === req.session.user.id) sessions.delete(sessionId);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message ?? "Bad request" });
  }
});

export default router;