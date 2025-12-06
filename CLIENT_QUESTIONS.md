# Questions to Ask Client

## 1. Apple Developer Account Access

**Question:** "What role do I have in the Apple Developer team? I need at least 'Developer' role to create certificates for EAS builds. 'Admin' role is preferred but not required."

**What you need:**
- ✅ **Minimum:** "Developer" role (can create certificates)
- ✅ **Preferred:** "Admin" role (full access)
- ❌ **Not enough:** "App Manager" or "Marketing" roles (can't create certificates)

**If you don't have the right role:**
- Ask client to upgrade your role in App Store Connect
- Go to: Users and Access → Your User → Edit → Change role to "Developer" or "Admin"

---

## 2. Environment Variables (For Server Testing)

**Question:** "I need these environment variables to test the server locally before publishing. Do you have them, or should I use the existing production values?"

**Required variables:**
```
SUPABASE_URL=                    # Your Supabase project URL
SUPABASE_ANON_KEY=               # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (keep secret!)
SESSION_SECRET=                  # Long random string for sessions
OPENAI_API_KEY=                  # OpenAI API key
```

**Options:**
1. **Use production values** (if you're okay testing against production database)
2. **Get separate test/staging values** (if they have a separate environment)
3. **Create new test Supabase project** (if you want to test separately)

**Note:** These are only needed for local testing. The production server (Render) already has them configured.

---

## 3. App Store Connect Setup

**Question:** "Is the app already created in App Store Connect with bundle ID `com.nailit.interview`? If not, should I create it or will you?"

**What needs to exist:**
- App listing in App Store Connect
- Bundle ID: `com.nailit.interview`
- IAP products configured (they should already be set up)

---

## 4. Google Play Console Setup

**Question:** "Is the app already created in Google Play Console with package name `com.nailit.interview`? If not, should I create it or will you?"

**What needs to exist:**
- App listing in Google Play Console
- Package name: `com.nailit.interview`
- IAP products configured (they should already be set up)

---

## Summary Email Template

You can send this to your client:

---

**Subject: Quick Questions for Milestone 4 - EAS Builds**

Hi [Client Name],

I'm ready to proceed with Milestone 4 (EAS builds + TestFlight/Google Play). I just need to confirm a few things:

1. **Apple Developer Role:** What role do I have in the Apple Developer team? I need at least "Developer" role to create certificates. If I don't have it, could you upgrade my access?

2. **Environment Variables (for local testing):** Do you want me to use the production Supabase/OpenAI credentials for local testing, or do you have separate test credentials I should use?

3. **App Store Connect:** Is the app already created in App Store Connect with bundle ID `com.nailit.interview`? 

4. **Google Play Console:** Is the app already created in Google Play Console with package name `com.nailit.interview`?

Once I have these confirmed, I can proceed with:
- Setting up EAS credentials
- Building the apps
- Submitting to TestFlight and Google Play internal testing
- Sending you the testing links

Thanks!

---

## What I Can Do Once You Have Everything

✅ Help configure `.env` file with the values  
✅ Guide you through EAS credential setup  
✅ Help build iOS and Android apps  
✅ Help submit to TestFlight and Google Play  
✅ Get you the testing links to send to client  

**Ready when you are!** 🚀

