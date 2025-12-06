# Apple Developer Role Issue - App Manager

## ❌ Problem

You have **"App Manager"** role, but EAS needs **"Developer"** or **"Admin"** role to:
- Create distribution certificates
- Create provisioning profiles
- Sign apps for TestFlight

**App Manager** can only:
- Manage app metadata
- Submit apps for review
- Manage TestFlight testers
- But **CANNOT** create certificates/profiles

---

## ✅ Solutions

### Option 1: Ask Client to Upgrade Your Role (Recommended)

**Message to send:**

> Hi [Client],
> 
> I need to build the app for TestFlight, but my current role "App Manager" doesn't have permission to create certificates. 
> 
> Could you upgrade my role to "Developer" or "Admin" in App Store Connect?
> 
> Steps:
> 1. Go to App Store Connect → Users and Access
> 2. Find my user (your email)
> 3. Click Edit
> 4. Change role from "App Manager" to "Developer" or "Admin"
> 
> This will allow me to create the certificates needed for EAS builds.
> 
> Thanks!

---

### Option 2: Client Creates Certificates Manually (Workaround)

If client doesn't want to upgrade your role, they can:

1. **Create Distribution Certificate:**
   - Go to Apple Developer Portal → Certificates
   - Create new "Apple Distribution" certificate
   - Download it

2. **Create Provisioning Profile:**
   - Go to Apple Developer Portal → Profiles
   - Create new "App Store" provisioning profile
   - Select bundle ID: `com.nailit.interview`
   - Select the distribution certificate
   - Download it

3. **Upload to EAS:**
   - You can then upload these manually to EAS
   - Or client can do the EAS credential setup themselves

**But this is more complicated and not recommended.**

---

### Option 3: Use Client's Apple ID (Not Recommended)

- Client could run `eas credentials -p ios` themselves
- Then share the credentials with you
- **Security risk** - not recommended

---

## 🎯 Best Solution

**Ask client to upgrade you to "Developer" role** - it's the cleanest solution and takes 2 minutes.

---

## What Happens If You Try With App Manager?

If you run `eas credentials -p ios` with App Manager role, you'll get an error like:

```
❌ Error: You don't have permission to create certificates
❌ Your role "App Manager" cannot perform this action
```

So you need to get the role upgraded first.

---

## After Role Upgrade

Once you have "Developer" or "Admin" role:

1. Run `eas credentials -p ios`
2. EAS will automatically create certificates
3. You can proceed with builds

---

**TL;DR:** Ask client to upgrade your role from "App Manager" to "Developer" or "Admin". Takes 2 minutes and solves everything! 🚀

