# How to Filter for App Logs in Xcode Console

## The Problem
You're seeing system logs (runningboardd, SpringBoard, WebKit) instead of your app's logs.

## Solution: Filter for App Logs

### In Xcode Console:

1. **In the search/filter box at the bottom**, type one of these:
   - `NailITInterviewPrep` (the app process name)
   - `🔍` (emoji from your logs)
   - `📦` (emoji from your logs)
   - `IAP` or `purchase`
   - `com.nailit.interview`

2. **Or filter by process:**
   - Look for logs that say `NailITInterviewPrep` in the process column
   - Ignore logs from `runningboardd`, `SpringBoard`, `symptomsd`, etc.

### What You Should See:

When you open the buy screen, you should see logs like:
```
🔍 Requesting products with IDs: [com.nailit.pack.starter, com.nailit.pack.plus, ...]
📦 Loaded products: 4
✅ Product IDs loaded: [com.nailit.pack.starter, ...]
  - com.nailit.pack.starter: Starter_Tokens ($X.XX)
```

When you tap "Buy":
```
🛒 Initiating purchase for: com.nailit.pack.plus
✅ Purchase successful: ...
🔑 Granting tokens with userId: ...
```

## Alternative: Use Console.app

1. **Open Console.app** (Applications → Utilities)
2. **Select your iPhone** from left sidebar
3. **In search box**, type: `NailITInterviewPrep`
4. **Or search for**: `🔍` or `IAP`

## If You Don't See Any App Logs

This could mean:
1. **App isn't logging** - Check if console.log is working
2. **Logs are being filtered out** - Try clearing filters
3. **App crashed** - Check for crash logs

## Quick Test

1. **Clear the filter** (remove any text from search box)
2. **Look for lines that say `NailITInterviewPrep`** in the process column
3. **Open your app** and navigate to buy screen
4. **Watch for new logs** with `NailITInterviewPrep` as the process

---

**Try filtering by:** `NailITInterviewPrep` or `🔍` or `IAP` in the search box!

