# Store Data Safety & Privacy Labels

## Google Play Data Safety Form

### Data Collection Overview
**Does your app collect or share any of the required user data types?**
- [ ] Yes, my app collects or shares user data
- [x] No, my app doesn't collect or share user data

*If "Yes" selected, complete sections below*

### Personal Information
- [ ] Name
- [ ] Email address  
- [ ] User IDs
- [ ] Address
- [ ] Phone number
- [ ] Race and ethnicity
- [ ] Political or religious beliefs
- [ ] Sexual orientation
- [ ] Other personal info

### Financial Information
- [ ] User payment info
- [ ] Purchase history
- [ ] Credit score
- [ ] Other financial info

### Health and Fitness
- [ ] Health info
- [ ] Fitness info

### Messages
- [ ] Emails
- [ ] SMS or MMS
- [ ] In-app messages
- [ ] Other messages

### Photos and Videos
- [ ] Photos
- [ ] Videos

### Audio Files
**⚠️ TODO: Confirm if app records/stores audio**
- [ ] Voice or sound recordings
- [ ] Music files  
- [ ] Other audio files

### Files and Documents
- [ ] Files and documents

### Calendar
- [ ] Calendar events

### Contacts
- [ ] Contacts

### App Activity
- [ ] App interactions
- [ ] In-app search history
- [ ] Installed apps
- [ ] Other user-generated content
- [ ] Other app activity

### Web Browsing
**⚠️ TODO: Confirm WebView data collection**
- [ ] Web browsing history

### App Info and Performance
- [ ] Crash logs
- [ ] Diagnostics
- [ ] Other app performance data

### Device or Other IDs
- [ ] Device or other IDs

## Data Usage and Sharing

For each data type collected, specify:

### Collection Purpose
- [ ] App functionality
- [ ] Analytics
- [ ] Developer communications  
- [ ] Advertising or marketing
- [ ] Fraud prevention, security, and compliance
- [ ] Personalization
- [ ] Account management

### Data Sharing
- [ ] Data is shared with third parties
- [ ] Data is not shared with third parties

### Data Retention
- [ ] Data is stored temporarily
- [ ] Data is stored until user requests deletion
- [ ] Data is stored for a specific period

### User Controls
- [ ] Users can request data deletion
- [ ] Users can turn data collection on/off
- [ ] No user controls available

## Apple App Store Privacy Labels

### Data Used to Track You
*Information used to track across apps/websites owned by other companies*

**Current Status: None (No tracking SDKs detected)**
- [ ] Contact Info
- [ ] Health & Fitness
- [ ] Financial Info
- [ ] Location
- [ ] Sensitive Info
- [ ] Contacts
- [ ] User Content
- [ ] Search History
- [ ] Identifiers
- [ ] Usage Data
- [ ] Diagnostics

### Data Linked to You
*Information linked to user identity*

**Potential Categories (TODO: Confirm):**
- [ ] Contact Info (email, name)
- [ ] User Content (audio recordings)
- [ ] Identifiers (user ID, device ID)
- [ ] Usage Data (interactions, performance)

### Data Not Linked to You  
*Information not linked to user identity*

**Potential Categories (TODO: Confirm):**
- [ ] Usage Data (anonymous analytics)
- [ ] Diagnostics (crash reports)

## Privacy Label Decision Matrix

### Audio Recordings (If Used)
- **Collection**: Yes/No? ⚠️ TODO: Confirm
- **Purpose**: Interview practice functionality  
- **Storage**: Local/Cloud? ⚠️ TODO: Confirm
- **Sharing**: Not shared with third parties
- **Apple Label**: User Content → Audio Data
- **Google Label**: Audio Files → Voice recordings

### User Account Data (If Used)
- **Collection**: Email, name for account creation
- **Purpose**: App functionality, account management
- **Storage**: Supabase backend
- **Sharing**: Not shared (except with Supabase as service provider)
- **Apple Label**: Contact Info
- **Google Label**: Personal Information

### Analytics Data (If Used)
- **Collection**: App usage, crashes, performance
- **Purpose**: App improvement, debugging
- **Storage**: Anonymous/aggregated
- **Sharing**: May share with analytics provider
- **Apple Label**: Usage Data, Diagnostics  
- **Google Label**: App Info and Performance

### WebView Data (If Tracked)
- **Collection**: Web interactions within app
- **Purpose**: App functionality
- **Storage**: Local/temporary
- **Sharing**: Not shared
- **Apple Label**: Usage Data
- **Google Label**: Web Browsing

## Required Action Items

### Before Store Submission:

1. **Audit Data Collection** ⚠️ CRITICAL
   - [ ] Review all code for data collection
   - [ ] Check Supabase data storage
   - [ ] Verify WebView data access
   - [ ] Confirm audio recording functionality

2. **Complete Store Forms**
   - [ ] Google Play Data Safety (in Play Console)
   - [ ] Apple Privacy Nutrition Labels (in App Store Connect)

3. **Prepare Privacy Policy**
   - [ ] Host privacy policy on HTTPS URL
   - [ ] Include all collected data types
   - [ ] Add contact information for privacy inquiries

### Data Collection Verification Questions:

**Authentication & User Data:**
- Does app create user accounts? (Yes/No)
- What user data is stored in Supabase?
- Is data encrypted in transit and at rest?

**Audio Recording:**
- Does app actually record audio? ⚠️ Permission exists but verify usage
- Where are recordings stored?
- How long are recordings kept?
- Can users delete recordings?

**Analytics & Tracking:**
- Any analytics SDKs integrated?
- Any crash reporting services?
- Any advertising networks?
- Device fingerprinting or unique identifiers?

**WebView Data:**
- Does WebView access cookies?
- Is web browsing history collected?
- Any JavaScript injection or data extraction?

## Form Completion Templates

### Minimal Data Collection (Recommended)
```
Data Collection: No
Data Sharing: No
Privacy Policy: Required (even if no data collected)
```

### With User Accounts
```
Personal Information: Email, Name
Purpose: App functionality, Account management
Shared: No (except service providers)
User Controls: Account deletion available
```

### With Audio Recording
```
Audio Files: Voice recordings
Purpose: App functionality (interview practice)
Shared: No
Storage: [Local device / Encrypted cloud]
User Controls: Users can delete recordings
```

## Compliance Notes

### Google Play Requirements:
- Data Safety form must be completed before app publication
- Accurate disclosures required (violations can result in suspension)
- Regular updates needed when data practices change

### App Store Requirements:
- Privacy labels appear on App Store listing
- Must be accurate and complete
- Updated within 30 days of app updates that change data practices

### Best Practices:
- **Be transparent**: Disclose all data collection
- **Minimize collection**: Only collect necessary data
- **User control**: Provide deletion/opt-out options
- **Regular review**: Update labels when adding features

---
*⚠️ Complete data audit before finalizing these forms*