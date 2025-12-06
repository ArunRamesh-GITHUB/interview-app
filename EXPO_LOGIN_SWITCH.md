# How to Switch Expo Accounts

## Log Out of Current Account

```bash
eas logout
```

This will log you out of the current Expo account.

## Log In with New Account

```bash
eas login
```

Then enter:
- Email of your new Expo account
- Password

## Verify You're Logged In

```bash
eas whoami
```

This shows which account you're currently logged in as.

## If You Get Errors

### "Already logged in"
If it says you're already logged in but with wrong account:
```bash
eas logout
eas login
```

### "Token expired"
```bash
eas logout
eas login
```

### Clear cache (if needed)
```bash
eas logout
# Then manually clear if needed:
rm -rf ~/.expo
eas login
```

---

**Quick Steps:**
1. `eas logout` - Log out
2. `eas login` - Log in with new account
3. `eas whoami` - Verify it worked

