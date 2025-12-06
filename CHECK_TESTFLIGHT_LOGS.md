# How to Check Console Logs from TestFlight Build on iPhone

## Method 1: Xcode Device Console (Easiest)

### Steps:

1. **Connect iPhone to Mac via USB**

2. **Open Xcode** (if not already open)

3. **Open Window → Devices and Simulators**
   - Or press: `Cmd + Shift + 2`

4. **Select your iPhone** from the left sidebar

5. **Click "Open Console"** button (bottom right)

6. **Filter logs:**
   - In the search box, type: `NailIT` or `mobile-shell` or `IAP`
   - This filters to show only your app's logs

7. **Open your app on iPhone** and navigate to buy screen

8. **Watch the console** - you'll see all logs in real-time:
   ```
   🔍 Requesting products with IDs: [...]
   📦 Loaded products: 4
   🛒 Initiating purchase for: ...
   ```

---

## Method 2: Console.app (macOS Built-in)

### Steps:

1. **Connect iPhone to Mac via USB**

2. **Open Console.app** (Applications → Utilities → Console)

3. **Select your iPhone** from left sidebar (under "Devices")

4. **Filter:**
   - In search box, type: `NailIT` or your bundle ID: `com.nailit.interview`

5. **Open app on iPhone** and use it

6. **Watch logs** appear in real-time

---

## Method 3: Safari Web Inspector (For WebView)

If your app uses WebView, you can also:

1. **On iPhone:** Settings → Safari → Advanced → Web Inspector (ON)

2. **On Mac:** Open Safari → Develop → [Your iPhone] → [Your App]

3. **Open Console tab** to see JavaScript logs

---

## What to Look For

### When Opening Buy Screen:
```
🔍 Requesting products with IDs: [com.nailit.pack.starter, com.nailit.pack.plus, ...]
📦 Loaded products: 4
✅ Product IDs loaded: [com.nailit.pack.starter, ...]
  - com.nailit.pack.starter: Starter_Tokens ($X.XX)
```

**If you see:**
- `📦 Loaded products: 0` → Products aren't loading from App Store
- `❌ Failed to fetch products:` → Error loading products
- `❌ No products loaded!` → Products not available

### When Tapping "Buy":
```
🛒 Initiating purchase for: com.nailit.pack.plus (Plus_Tokens)
✅ Purchase successful: ...
🔑 Granting tokens with userId: [user-id]
```

**If you see:**
- `❌ Purchase error:` → Check error code and message
- `E_USER_CANCELLED` → User cancelled (not a bug)
- `E_ITEM_UNAVAILABLE` → Product not available
- `E_SERVICE_ERROR` → App Store service error

---

## Quick Test

1. **Connect iPhone to Mac**
2. **Open Xcode → Window → Devices and Simulators**
3. **Select iPhone → Open Console**
4. **Filter by: `NailIT` or `IAP`**
5. **Open app on iPhone**
6. **Go to buy screen** - watch console
7. **Tap "Buy"** - watch for errors

---

## If You Don't See Logs

### Check:
- iPhone is connected via USB (not just WiFi)
- iPhone is unlocked
- You've opened the app at least once
- Xcode/Console can see your device

### Alternative:
- Use a development build instead of TestFlight
- Development builds show logs more easily
- But TestFlight logs should work with Xcode console

---

**Easiest method:** Xcode → Window → Devices and Simulators → Select iPhone → Open Console → Filter by app name

