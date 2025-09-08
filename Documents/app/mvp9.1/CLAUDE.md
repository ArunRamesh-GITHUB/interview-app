# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AI Interview App is a full-stack interview training application with multiple interfaces:
- **Backend**: Express.js server with OpenAI integration, Supabase auth, and TTS/STT capabilities
- **Web Frontend**: React + Vite + Tailwind CSS (shadcn-style) single-page application
- **Mobile App**: Expo React Native application
- **Legacy Interface**: Static HTML/JS interface in `public/`

## Commands

### Backend Development (Root)
```bash
npm install              # Install server dependencies
npm run dev             # Start development server (port 3000)
npm start               # Start production server
```

### Web Frontend Development
```bash
cd web
npm install             # Install web dependencies
npm run dev             # Start Vite dev server (port 5173, proxies to :3000)
npm run build           # Build for production
npm run preview         # Preview production build
```

### Mobile Development
```bash
cd mobile-shell
npm install             # Install mobile dependencies
npx expo start          # Start Expo development server
npm run reset-project   # Reset to blank Expo project
```

### Testing & Quality
Look for test scripts in individual package.json files. No centralized test runner configured yet.

## Architecture

### Server Architecture (`server.js`)
- **Authentication**: HttpOnly session cookies with Supabase backend
- **Rate Limiting**: Multiple tiers (strict: 30/min, light: 120/min)
- **Security**: Helmet CSP, session management, input validation with Zod
- **OpenAI Integration**: 
  - TTS (Text-to-Speech) with caching
  - STT (Speech-to-Text) via Whisper
  - Scoring with GPT-4o-mini (forced JSON schema)
  - **Realtime API**: Hard-locked to `gpt-4o-mini-realtime-preview-2024-12-17`
- **ElevenLabs Integration**: Optional TTS proxy (requires `ELEVENLABS_API_KEY`)

### Data Layer
- **Supabase**: Authentication, user profiles, attempts storage
- **RLS (Row Level Security)**: Users can only access their own data
- **Tables**: 
  - `profiles` (user metadata)
  - `attempts` (saved interview responses with scoring)

### Frontend Architectures

#### Web App (`web/`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite with React plugin
- **Styling**: Tailwind CSS + PostCSS
- **Routing**: React Router DOM (file-based routing in `src/pages/`)
- **Components**: Custom shadcn-style UI components in `components/ui/`
- **Dev Setup**: Vite proxy to backend (:5173 → :3000)

#### Mobile App (`mobile-shell/`)
- **Framework**: Expo with React Native
- **Routing**: File-based routing in `app/` directory
- **Development**: Standard Expo workflow with development builds

#### Legacy Interface (`public/`)
- **Framework**: Vanilla HTML/CSS/JS
- **Features**: Simple interview interface with inline styles
- **Purpose**: Lightweight alternative to React frontend

### Interview Modes & Features

1. **Live Interview Mode**: AI asks questions aloud, records responses, provides scoring
2. **Drill Questions**: Practice with written or spoken responses, get model answers
3. **Conversational Agent**: Back-and-forth voice interview with ElevenLabs/OpenAI TTS
4. **Persona Support**: Medical, Oxbridge, Apprenticeship interviewing styles
5. **Answer Storage**: All attempts saved with RLS security in Supabase

### Scoring System
- **Engine**: OpenAI GPT-4o-mini with structured JSON output
- **Rubric**: Persona-specific evaluation criteria (cached for performance)
- **Bands**: Poor/Weak/Mixed/Strong/Outstanding (0-100 scale)
- **Output**: Score, band, summary, strengths, improvements, follow-up questions

## Environment Setup

### Required Environment Variables (`.env`)
```
OPENAI_API_KEY=                    # Required for all AI features
SUPABASE_URL=                     # Supabase project URL
SUPABASE_ANON_KEY=                # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Server-side operations
SESSION_SECRET=                   # Long random string for sessions
PORT=3000                        # Server port
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Optional
ELEVENLABS_API_KEY=              # Enables premium TTS via ElevenLabs
TTS_CACHE_DIR=                   # TTS file cache location (default: ./cache_tts)
```

### Database Setup
Run `supabase_add_attempts.sql` in Supabase SQL Editor to create the attempts table with RLS.

## Key Implementation Details

### Authentication Flow
- Server-only authentication (no tokens in browser)
- Registration creates Supabase user + profile entry
- Login establishes HttpOnly session cookie
- All API routes validate `req.session.user.id`

### Audio Processing
- **Upload**: Multer handles multipart audio (25MB limit)
- **Transcription**: OpenAI Whisper via File API
- **TTS Caching**: SHA1-based file caching for performance
- **Security**: Temporary files cleaned after processing

### API Endpoints Structure
- `/api/auth/*` - Registration, login, logout, password reset
- `/api/tts*` - Text-to-speech (OpenAI + ElevenLabs)
- `/api/transcribe` - Audio-to-text with scoring
- `/api/score` - Text scoring
- `/api/model-answer` - Generate exemplar responses
- `/api/attempts/*` - CRUD for saved attempts
- `/api/realtime/session` - OpenAI Realtime API token generation

### Performance Optimizations
- **TTS Caching**: File-based caching with SHA1 keys
- **Rubric Caching**: In-memory persona-based rubric compilation
- **Rate Limiting**: Tiered limits prevent abuse
- **JSON Schema**: Strict OpenAI response formatting for reliability

## Development Notes

### Vite Configuration
The web app uses a custom Vite config with:
- Cloudflare tunnel support for external testing
- HMR over WSS for HTTPS tunnels
- API proxy to backend server
- Specific allowed hosts for development

### Mobile Development
Mobile app is a separate Expo project in `mobile-shell/` with its own dependencies and routing system.

### Legacy Support
The `public/` directory contains a self-contained HTML/JS interface that works without the React build process.