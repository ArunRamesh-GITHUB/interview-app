// config/pricing.js
export const TOKEN_RULES = {
  TOKEN_PER_PRACTICE_MIN: 1,        // 1 token = 1 practice minute
  TOKEN_PER_REALTIME_MIN: 9,        // realtime is ~9x practice cost
  PRACTICE_ROUNDING_TOKENS: 0.25,   // 15s increments
  REALTIME_ROUNDING_TOKENS: 1.5,    // 10s increments
  REALTIME_MIN_TOKENS_PER_SESSION: 5,
};

export const PLAN_TOKEN_GRANTS = {
  free: { monthlyTokens: 0, priceGBP: 0 },
  starter: { monthlyTokens: 120, priceGBP: 6.99 },
  plus: { monthlyTokens: 250, priceGBP: 12.99 },
  pro: { monthlyTokens: 480, priceGBP: 29.99 },
  power: { monthlyTokens: 1000, priceGBP: 44.99 },
};

// Utility to translate minutes -> tokens using our rounding rules
export function practiceSecondsToTokens(seconds) {
  const tokens = seconds / 60 * TOKEN_RULES.TOKEN_PER_PRACTICE_MIN;
  const step = TOKEN_RULES.PRACTICE_ROUNDING_TOKENS;
  return Math.max(step, Math.ceil(tokens / step) * step);
}

export function realtimeSecondsToTokens(seconds) {
  const tokens = (seconds / 60) * TOKEN_RULES.TOKEN_PER_REALTIME_MIN;
  const step = TOKEN_RULES.REALTIME_ROUNDING_TOKENS;
  const rounded = Math.max(step, Math.ceil(tokens / step) * step);
  return Math.max(rounded, TOKEN_RULES.REALTIME_MIN_TOKENS_PER_SESSION);
}