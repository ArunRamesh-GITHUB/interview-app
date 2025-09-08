# AI Interview App — CONTEXT.md

**Version:** 6.3 (Enhanced with Realtime API and optimized performance)  
**Last Updated:** August 31, 2025 - All Critical Issues Resolved

## Stack Overview
- **Backend:** Node.js (Express) + OpenAI API + Supabase
- **Frontend:** React + Vite + Tailwind CSS (shadcn-style) + React Router
- **Mobile:** Expo React Native (separate app)
- **Legacy:** Static HTML/JS interface in `public/`
- **Security:** HttpOnly session cookies, Helmet CSP, rate limiting, RLS in Supabase

## Architecture Summary
Multi-interface AI interview training application with:
1. **Express Server** (`server.js`) - Authentication, AI processing, API endpoints
2. **React Web App** (`web/`) - Modern single-page application
3. **Mobile App** (`mobile-shell/`) - Expo-based React Native app  
4. **Legacy Interface** (`public/`) - Simple HTML/JS fallback

## ✅ RESOLVED ISSUES (August 2025)

All critical and medium priority issues have been successfully resolved:

### ✅ CRITICAL FIXES IMPLEMENTED

#### 1. Port Configuration Standardized ✅
- **Fixed:** All configurations now use PORT=3001 consistently
- **Files Updated:** `server.js:88`, `.env.example:5`, `web/vite.config.ts:18`
- **Result:** Development setup works seamlessly, no API call failures

#### 2. API Endpoint Consistency ✅  
- **Fixed:** Added backward-compatible auth route aliases
- **Implementation:** `/api/auth/*` routes now mirror `/api/*` routes
- **Files Updated:** `server.js:480-505`
- **Result:** Both legacy and new client code work without modification

#### 3. Dependencies Resolved ✅
- **Fixed:** All required dependencies properly declared in package.json
- **Dependencies:** `zod@^3.25.76` added to dependencies
- **Result:** Server starts cleanly without dependency errors

#### 4. Environment-Based Configuration ✅
- **Fixed:** Tunnel configuration now environment-driven
- **Implementation:** `VITE_TUNNEL_HOST` environment variable support
- **Files Updated:** `web/vite.config.ts:4,11-15,23-27`
- **Result:** Flexible development setup for all developers

#### 5. OpenAI Model Names Corrected ✅
- **Fixed:** Updated to official OpenAI model identifiers
- **Changes:** `whisper-1` (transcription), `tts-1` (text-to-speech)
- **Files Updated:** `server.js:97-98`, `.env.example:29-30`
- **Result:** No more OpenAI API model errors

#### 6. Security Enhanced ✅
- **Fixed:** Created `.env.example` with placeholders, added `.gitignore`
- **Security:** Real credentials no longer committed to repository
- **Files Created:** `.env.example`, `.gitignore`
- **Result:** Proper credential management and repository security

#### 7. Memory Management Optimized ✅
- **Fixed:** Comprehensive cache management with TTL and size limits
- **Implementation:** LRU eviction, automatic cleanup jobs, debug logging
- **Features:** 30-minute TTL for detailed results, 1000-item LRU limits
- **Result:** Prevents memory leaks and unbounded growth

#### 8. Error Handling Comprehensively Enhanced ✅
- **Fixed:** Robust error handling with retry logic and user-friendly messages
- **Features:** 
  - Exponential backoff retry for transient failures
  - Rate limit detection and automatic retry
  - Quota exceeded detection with clear messaging
  - Structured error logging without credential exposure
- **Implementation:** `retryOpenAICall()` function wraps all OpenAI API calls
- **Result:** Improved reliability and user experience during API issues

### 🟢 LOW PRIORITY ISSUES

#### 9. TypeScript Configuration Inconsistencies
- **Issue:** Different TS configs across web and mobile apps
- **Files:** `web/tsconfig.json`, `mobile-shell/tsconfig.json`
- **Impact:** Inconsistent type checking, potential runtime errors
- **Solution:** Standardize TypeScript configurations

#### 10. Unused Dependencies and Code
- **Issue:** Several dependencies and code paths appear unused
- **Files:** Various package.json files, unused imports
- **Impact:** Increased bundle size, maintenance overhead
- **Solution:** Audit and remove unused code

## Application Flow & Features

### Authentication System
- **Method:** HttpOnly session cookies with Supabase backend
- **Security:** Server-only authentication, no tokens in browser
- **Features:** Registration, login, logout, password reset

### Interview Modes
1. **Live Interview:** AI asks questions aloud, auto-records answers, provides scoring
2. **Drill Questions:** Practice with predefined questions, get model answers
3. **Realtime Interview:** Voice conversation with OpenAI Realtime API (locked to gpt-4o-mini-realtime)
4. **Conversational Agent:** Back-and-forth interviewing with ElevenLabs TTS

### Scoring System
- **Engine:** OpenAI GPT-4o-mini with structured JSON schema
- **Caching:** Multiple layers for performance (rubric, scoring, immediate results)
- **Personas:** Medical, Oxbridge, Apprenticeship with tailored rubrics
- **Output:** Score (0-100), band (Poor/Weak/Mixed/Strong/Outstanding), feedback

### Data Architecture
- **Database:** Supabase with Row Level Security (RLS)
- **Tables:** profiles (user data), attempts (interview responses)
- **Storage:** No audio stored, only transcripts and scores
- **Security:** Users can only access their own data

## Environment Configuration

### Required Environment Variables
```
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Server Configuration
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Session Security
SESSION_SECRET=change_this_to_a_very_long_random_string_for_production

# OpenAI Realtime API
OPENAI_REALTIME_MODEL=gpt-4o-mini-realtime-preview-2024-12-17
```

### Optional Variables
```
# Optional Features
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
TTS_CACHE_DIR=./cache_tts
FOLLOWUP_IMMEDIATE_MICROCALL=1

# Development Tools (Web)
VITE_TUNNEL_HOST=localhost

# Additional Configuration
TRANSCRIBE_MODEL=whisper-1
TTS_MODEL=tts-1
SCORING_MODEL=gpt-4o-mini
SCORING_MAX_TOKENS=250
```

## Development Commands

### Backend (Root Directory)
```bash
npm install              # Install server dependencies
npm run dev             # Start development server (port 3001)
npm start               # Start production server
```

### Web Frontend
```bash
cd web
npm install             # Install web dependencies
npm run dev             # Start Vite dev server (port 5173, proxies to :3001)
npm run build           # Build for production
npm run preview         # Preview production build
```

### Mobile App
```bash
cd mobile-shell
npm install             # Install mobile dependencies
npx expo start          # Start Expo development server
```

## Performance Optimizations Implemented

### Server-Side Caching
- **TTS Caching:** SHA1-based file caching for audio generation
- **Rubric Caching:** In-memory persona-based rubric compilation
- **Scoring Caching:** LRU cache for scoring results with size limits
- **Immediate Scoring:** Fast heuristic-based responses for better UX

### API Optimizations
- **Background Processing:** Detailed scoring happens after immediate response
- **Rate Limiting:** Tiered limits (30/min strict, 120/min light)
- **Request Validation:** Input sanitization and size limits
- **Cleanup Jobs:** Automatic cleanup of temporary data

## Security Implementation

### Authentication & Authorization
- **HttpOnly Cookies:** Session management without client-side tokens
- **RLS Policies:** Database-level user isolation
- **Server-Side Validation:** All critical operations server-validated

### Content Security
- **Helmet CSP:** Content Security Policy implementation
- **Input Validation:** File size limits, content sanitization
- **API Rate Limiting:** Prevent abuse and DoS attacks

### Data Protection
- **No Audio Storage:** Only transcripts stored, audio files deleted
- **Key Rotation:** Environment-based key management
- **Secure Headers:** Security headers via Helmet middleware

## Troubleshooting Guide

### Common Development Issues
1. **401 Errors:** Ensure using correct ports (5173 for dev, 3001 for API)
2. **Build Failures:** Check node_modules and package-lock.json consistency
3. **Database Errors:** Verify supabase_add_attempts.sql has been run
4. **Audio Issues:** Check microphone permissions and HTTPS context

### Production Deployment
1. **Environment:** Set NODE_ENV=production
2. **Build Process:** Run `cd web && npm run build` before starting server
3. **SSL/HTTPS:** Required for microphone access in production
4. **Database:** Ensure RLS policies are active in Supabase

## Recommended Immediate Actions

1. **Fix port configurations** across all files
2. **Rotate and secure API keys** in environment variables
3. **Update OpenAI model names** to correct identifiers
4. **Add missing dependencies** (zod if needed)
5. **Implement proper error handling** throughout the application
6. **Review and clean up caching strategies** to prevent memory leaks

## Architecture Strengths
- ✅ Multiple interface options (web, mobile, legacy)
- ✅ Strong separation of concerns
- ✅ Comprehensive authentication system
- ✅ Performance optimizations with caching
- ✅ Security-first approach with RLS and server-side validation
- ✅ Modern tech stack with good maintainability

This audit provides a solid foundation for fixing critical issues and maintaining the application going forward.