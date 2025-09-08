// server/db/tokens.js
// This file is actually not needed since the server already has direct token consumption
// Keeping it for reference but it won't be used

export async function spConsumeTokens({ user_id, amount, reason, meta = {} }) {
  // This function is no longer used - the main server handles token consumption directly
  throw new Error("This function is deprecated - use the main server token endpoints");
}