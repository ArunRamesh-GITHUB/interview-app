# How to Clear Pre-filled Apple ID

## Option 1: Clear the Line
- **Mac/Linux**: Press `Ctrl+U` to clear the entire line
- **Windows**: Press `Ctrl+Backspace` or select all and delete
- Then type your correct Apple ID

## Option 2: Cancel and Restart
1. Press `Ctrl+C` to cancel
2. Run again: `eas credentials -p ios`
3. When prompted for Apple ID, type your correct one

## Option 3: Clear Cached Credentials
If EAS cached the wrong Apple ID:

```bash
# Cancel current command (Ctrl+C)
# Then try clearing Expo cache
rm -rf ~/.expo
eas credentials -p ios
```

## Option 4: Manual Input
- Try selecting all text (Ctrl+A or Cmd+A)
- Then delete and type your correct Apple ID

---

**The Apple ID you need:** The one that has **admin access** to the Apple Developer account (not mndiaye.001@protonmail.com)

