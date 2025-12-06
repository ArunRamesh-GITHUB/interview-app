# Using Downloaded Certificates from EAS

## Option 1: Upload via credentials.json (Recommended)

1. **Go to credentials menu:**
   ```bash
   eas credentials -p ios
   ```

2. **Select:** "credentials.json: Upload/Download credentials between EAS servers and your local json"

3. **Choose:** "Upload credentials.json"

4. **Create credentials.json file** with this structure:
   ```json
   {
     "ios": {
       "distributionCertificate": {
         "certP12": "path/to/DistCert_6UDK2P692Q.p12",
         "certPassword": "password_from_DistCertCredentials_file"
       },
       "provisioningProfile": {
         "provisioningProfile": "path/to/provisioning_profile.mobileprovision"
       }
     }
   }
   ```

5. **Upload it** - EAS will use these credentials

## Option 2: Manual Certificate Installation

1. **Install the .p12 certificate on your Mac:**
   ```bash
   # Double-click the .p12 file, or:
   open DistCert_6UDK2P692Q.p12
   ```
   - Enter the password (from DistCertCredentials file)
   - Install in Keychain

2. **Check the DistCertCredentials_6UDK2P692Q.md file** - it should have:
   - Certificate password
   - Provisioning profile info
   - Any other details

3. **Then try building again:**
   ```bash
   npm run build:ios
   ```

## Option 3: Use EAS Credentials Menu

1. **Run:** `eas credentials -p ios`
2. **Select:** "Build Credentials: Manage everything needed to build your project"
3. **Choose:** "Set up new credentials" or "Use existing"
4. **When prompted**, you can provide:
   - The .p12 file path
   - The password from the credentials file
   - The provisioning profile

## Important Notes

- **Check the .md file first** - it should contain the password and instructions
- The certificate is for "Arun Ramesh (Individual)" team
- You might still need to use the correct Apple ID for that team when building
- EAS might validate team membership even with uploaded certificates

## Quick Test

1. **Read the DistCertCredentials file:**
   ```bash
   cat DistCertCredentials_6UDK2P692Q.md
   ```

2. **Then try the credentials.json upload method** (Option 1) - it's the cleanest

---

**Try Option 1 first** - upload via credentials.json menu in EAS!

