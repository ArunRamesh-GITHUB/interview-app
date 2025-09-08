import express from "express";
import { z } from "zod";
import { spConsumeTokens } from "../db/tokens.js";

const router = express.Router();

// Auth middleware (assuming it exists in server.js)
function authRequired(req, res, next) { 
  if (req.session?.user?.id) {
    return next();
  } 
  return res.status(401).json({ error: 'Not authenticated' }) 
}

const ConsumeSchema = z.object({
  page: z.enum(["DRILL", "LIVE", "REALTIME"]),
  amount: z.number().positive(),
  meta: z.any().optional(),
});

router.post("/consume", authRequired, async (req, res) => {
  try {
    const { page, amount, meta } = ConsumeSchema.parse(req.body);
    if (amount > 10) return res.status(400).json({ ok: false, error: "Amount too large" });

    const { new_balance } = await spConsumeTokens({
      user_id: req.session.user.id,
      amount,
      reason: `METERED_${page}`,
      meta: meta ?? {},
    });

    return res.json({ ok: true, balance: new_balance });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ ok: false, error: e.message ?? "Invalid" });
  }
});

export default router;