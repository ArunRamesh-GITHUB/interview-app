# Realtime AI Interview - Complete Technical Documentation

**Last Updated:** August 31, 2025  
**Status:** WORKING - Full-featured realtime voice interviewer with timer, personas, and rating system

## Overview

The Realtime AI Interview page (`web/src/pages/RealtimeInterview.tsx`) implements a comprehensive voice interview system using OpenAI's Realtime API via WebRTC. The system features timed interviews (1-5 minutes), persona-based interviewing styles, optional AI rating system, microphone controls, and real-time audio streaming.

## Architecture Flow

```
User Speech → Browser Mic → WebRTC → OpenAI Realtime API → WebRTC → Browser Speakers → User Hears AI
                              ↓
                     Data Channel (JSON Events)
                              ↓
              Timer + Persona Instructions + Voice + Rating System
```

## Complete State Management

### Core State Variables
```typescript
const [status, setStatus] = useState<ConnectionStatus>('idle')           // Connection state
const [persona, setPersona] = useState<PersonaKey | null>(null)          // Selected persona
const [subject, setSubject] = useState<OxbridgeSubject | null>(null)     // Oxbridge subject
const [instructions, setInstructions] = useState(string)                 // Custom instructions
const [showPreview, setShowPreview] = useState(false)                    // Show generated instructions
const [errorMsg, setErrorMsg] = useState('')                             // Error display
const [isMuted, setIsMuted] = useState(false)                            // Microphone mute state
const [enableRating, setEnableRating] = useState(false)                  // AI rating toggle
const [selectedDuration, setSelectedDuration] = useState<number>(5)      // Interview timer (minutes)
const [timeRemaining, setTimeRemaining] = useState<number | null>(null)  // Countdown timer
const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null) // Timer interval
```

### WebRTC References
```typescript
const pcRef = useRef<RTCPeerConnection | null>(null)     // Peer connection
const dcRef = useRef<RTCDataChannel | null>(null)        // Data channel
const localStreamRef = useRef<MediaStream | null>(null)  // User's microphone
const audioRef = useRef<HTMLAudioElement>(null)          // AI audio output
const primedRef = useRef(false)                          // Prevents duplicate first questions
```

## Timer System

### Duration Selection
- **Available durations:** 1, 2, 3, 5 minutes
- **Visual selection:** Button group with active state styling
- **Disabled during:** Connection active (status !== 'idle')

### Timer Implementation
```typescript
const startTimer = () => {
  const durationInSeconds = selectedDuration * 60
  setTimeRemaining(durationInSeconds)
  
  const interval = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev === null || prev <= 1) {
        clearInterval(interval)
        setTimerInterval(null)
        disconnect()  // Auto-disconnect when timer expires
        return 0
      }
      return prev - 1
    })
  }, 1000)
  
  setTimerInterval(interval)
}
```

### Timer Display
- **Format:** MM:SS (e.g., "5:00", "0:30")
- **Color coding:**
  - Green: > 60 seconds remaining
  - Yellow: 30-60 seconds remaining  
  - Red with pulse: < 30 seconds remaining
- **Visual indicator:** Colored dot matching timer state

### Timer Cleanup
- **Auto-disconnect:** Timer reaching zero triggers `disconnect()`
- **Manual cleanup:** `cleanup()` function clears timer interval
- **Unmount protection:** `useEffect` cleanup prevents memory leaks

## Persona System

### Core Dependencies
- **`web/src/lib/personas.ts`** - Persona configurations and instruction builders
- **`web/src/lib/auth.tsx`** - Authentication context for user validation

### Available Personas
1. **Oxbridge** - Academic interviews requiring subject selection
2. **Medicine** - MMI-style medical admission interviews  
3. **Apprenticeship** - STAR behavioral + practical problem-solving interviews
4. **Custom** - User-defined instructions (persona = null)

### Persona Selection UI
```typescript
// Persona buttons with active state styling
{(Object.keys(PERSONA_CONFIGS) as PersonaKey[]).map((key) => (
  <button
    onClick={() => {
      setPersona(key)
      if (key !== 'oxbridge') setSubject(null)  // Clear subject for non-Oxbridge
    }}
    className={persona === key ? 'active-styles' : 'inactive-styles'}
    disabled={status === 'connecting'}
  >
    {PERSONA_CONFIGS[key].label}
  </button>
))}
```

### Subject Selection (Oxbridge Only)
- **Conditional rendering:** Only appears when `persona === 'oxbridge'`
- **Options:** Populated from `OXBRIDGE_SUBJECTS` array
- **Validation:** Connect button disabled when Oxbridge selected without subject
- **Reset behavior:** Subject cleared when switching away from Oxbridge

### Instruction Generation
```typescript
const finalInstructions = persona 
  ? buildInstructions(persona, subject || undefined, enableRating)
  : instructions
```

## AI Rating System

### Rating Toggle
```typescript
<input
  type="checkbox"
  checked={enableRating}
  onChange={(e) => setEnableRating(e.target.checked)}
  disabled={status === 'connecting'}
/>
```

### Rating Integration
- **Instruction modification:** `buildInstructions()` includes rating parameters when enabled
- **Scale:** 1-10 numeric scoring after each response
- **Application:** Works with all personas and custom instructions
- **User feedback:** Descriptive text explains the rating system

## Audio Controls

### Microphone Management
```typescript
const toggleMute = () => {
  if (localStreamRef.current) {
    const audioTracks = localStreamRef.current.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = isMuted  // Toggle track enabled state
    })
    setIsMuted(!isMuted)
  }
}
```

### Audio Element
```typescript
<audio
  ref={audioRef}
  autoPlay          // Immediate playback of AI responses
  playsInline       // Mobile compatibility
  controls          // User volume controls
  className="w-full"
/>
```

## Connection Management

### Authentication Requirement
```typescript
if (!user) {
  setErrorMsg('Please sign in first')
  return
}
```

### Connection Sequence
1. **Validation:** Check user authentication and persona/subject requirements
2. **Token request:** POST to `/api/realtime/session` with instructions and voice
3. **Media access:** `getUserMedia({ audio: true })`
4. **WebRTC setup:** Create peer connection with STUN servers
5. **Track management:** Add microphone track, create audio receiver
6. **Data channel:** Create 'oai-events' channel for JSON communication
7. **SDP exchange:** Send offer to OpenAI, receive answer
8. **Session update:** Send final instructions via data channel
9. **Timer start:** Begin countdown when connection established

### Session Creation Request
```typescript
const sessionRes = await fetch('/api/realtime/session', {
  method: 'POST',
  credentials: 'include',     // Include session cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instructions: finalInstructions,
    voice: persona ? PERSONA_CONFIGS[persona].voiceDefault || 'alloy' : 'alloy'
  })
})
```

### WebRTC Configuration
```typescript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
})

// Add local microphone
stream.getTracks().forEach(track => {
  pc.addTrack(track, stream)
})

// Add receiver for AI audio
pc.addTransceiver('audio', { direction: 'recvonly' })

// Handle remote audio stream
pc.ontrack = (event) => {
  if (audioRef.current && event.streams[0]) {
    audioRef.current.srcObject = event.streams[0]
  }
}
```

### Data Channel Events
```typescript
dc.onopen = () => {
  primedRef.current = false
  // Send session configuration
  const sessionUpdate = {
    type: 'session.update',
    session: {
      instructions: finalInstructions,
      voice,
      turn_detection: { type: 'server_vad' },
      input_audio_transcription: { model: 'whisper-1' }
    }
  }
  dc.send(JSON.stringify(sessionUpdate))
  setStatus('connected')
  startTimer()  // Begin interview timer
}

dc.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if ((message.type === 'session.updated' || message.type === 'session.created') && !primedRef.current) {
    primedRef.current = true
    sendFirstQuestion()  // Trigger AI to start interview
  }
}
```

## Mid-Session Persona Changes

### Apply Persona Function
```typescript
const applyPersona = () => {
  if (!dcRef.current || dcRef.current.readyState !== 'open') return
  
  if (persona === 'oxbridge' && !subject) {
    setErrorMsg('Please select an Oxbridge subject before applying the persona.')
    return
  }
  
  const finalInstructions = persona ? buildInstructions(persona, subject || undefined, enableRating) : instructions
  const voice = persona ? PERSONA_CONFIGS[persona].voiceDefault || 'alloy' : 'alloy'
  
  const sessionUpdate = {
    type: 'session.update',
    session: {
      instructions: finalInstructions,
      voice,
      turn_detection: { type: 'server_vad' },
      input_audio_transcription: { model: 'whisper-1' }
    }
  }
  dcRef.current.send(JSON.stringify(sessionUpdate))
  
  primedRef.current = true
  sendFirstQuestion()  // Restart with new persona
}
```

## Resource Cleanup

### Comprehensive Cleanup Function
```typescript
const cleanup = () => {
  // Clear timer
  if (timerInterval) {
    clearInterval(timerInterval)
    setTimerInterval(null)
  }
  setTimeRemaining(null)
  
  // Stop local tracks
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => track.stop())
    localStreamRef.current = null
  }
  
  // Close data channel
  if (dcRef.current) {
    dcRef.current.close()
    dcRef.current = null
  }
  
  // Close peer connection
  if (pcRef.current) {
    pcRef.current.close()
    pcRef.current = null
  }
  
  setStatus('idle')
  setIsMuted(false)
}
```

### Cleanup Triggers
1. **Manual disconnect:** User clicks disconnect button
2. **Timer expiration:** Automatic disconnect when timer reaches zero
3. **Component unmount:** `useEffect` cleanup prevents memory leaks
4. **Connection errors:** Error states trigger cleanup

## UI Validation & Error Handling

### Connection Button State
```typescript
<Button
  onClick={connect}
  disabled={
    status !== 'idle' ||           // Not idle
    !user ||                       // Not authenticated  
    (persona === 'oxbridge' && !subject)  // Oxbridge without subject
  }
/>
```

### Apply Persona Button State
```typescript
<Button
  onClick={applyPersona}
  disabled={persona === 'oxbridge' && !subject}  // Oxbridge validation
/>
```

### Error Display
```typescript
{errorMsg && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
    {errorMsg}
  </div>
)}
```

### Warning Messages
```typescript
{persona === 'oxbridge' && !subject && (
  <p className="text-sm text-orange-600">
    Please select a subject to enable connection.
  </p>
)}
```

## Status Indicators

### Connection Status Display
```typescript
<div className={`w-3 h-3 rounded-full ${
  status === 'connected' ? 'bg-green-500' :
  status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
  status === 'error' ? 'bg-red-500' :
  'bg-gray-300'
}`} />
<span className="text-sm text-gray-600 capitalize">{status}</span>
```

### Timer Status Display  
```typescript
<div className={`w-3 h-3 rounded-full ${
  timeRemaining > 60 ? 'bg-green-500' :
  timeRemaining > 30 ? 'bg-yellow-500' :
  'bg-red-500 animate-pulse'
}`} />
<span className={`text-lg font-mono ${
  timeRemaining <= 30 ? 'text-red-600 font-bold' : 'text-gray-700'
}`}>
  {formatTime(timeRemaining)}
</span>
```

## Required Server Components

### Session Endpoint (`/api/realtime/session`)
**Expected location:** `server.js`
**Function:** Create OpenAI Realtime API session with ephemeral token

**Environment Variables:**
```env
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Request format:**
```json
{
  "instructions": "Generated persona instructions with optional rating system",
  "voice": "alloy"
}
```

**Response format:**
```json
{
  "client_secret": {
    "value": "ephemeral_token_here"
  }
}
```

**Critical requirements:**
- Must include `OpenAI-Beta: realtime=v1` header in OpenAI request
- Must be authenticated (checks `req.session.user.id`)
- Instructions can be up to ~1200 characters
- Voice parameter supports OpenAI voice options

## Dependencies & Imports

### Core Dependencies
```typescript
import React from 'react'
import { Button } from '../components/ui/button'
import { useAuth } from '../lib/auth'
import { PersonaKey, OxbridgeSubject, PERSONA_CONFIGS, OXBRIDGE_SUBJECTS, buildInstructions } from '../lib/personas'
```

### Required Components
- **Button component:** shadcn-style UI button from `components/ui/button`
- **Authentication hook:** `useAuth()` provides user session state
- **Persona system:** Complete persona configuration and instruction building

## OpenAI Realtime API Integration

### Model Configuration
- **Hard-coded model:** `gpt-4o-mini-realtime-preview-2024-12-17`
- **Voice configuration:** All personas use 'alloy' voice for reliability
- **Session settings:**
  - `turn_detection: { type: 'server_vad' }` - Server-side voice activity detection
  - `input_audio_transcription: { model: 'whisper-1' }` - Audio transcription

### Critical Events
- `session.created/session.updated` - Session ready for questions
- `response.create` - Trigger AI response generation
- `input_audio_buffer.speech_started/stopped` - User speech detection
- `response.audio.delta` - AI audio chunks (auto-played via WebRTC)
- `conversation.item.input_audio_transcription.completed` - User speech transcribed

## Browser & Network Requirements

### WebRTC Support
- **Chrome:** 60+
- **Firefox:** 55+  
- **Safari:** 14+
- **Edge:** 79+

### Network Requirements
- **HTTPS required:** getUserMedia requires secure context in production
- **STUN server access:** `stun:stun.l.google.com:19302`
- **OpenAI API access:** Outbound HTTPS to `api.openai.com`
- **WebRTC UDP:** Typically ports 1024-65535

### Audio Requirements
- **Microphone permissions:** Required for user input
- **Audio autoplay:** May require user interaction in some browsers
- **Audio controls:** Users can adjust volume via HTML audio controls

## Testing & Debugging

### Console Debugging
```javascript
// Check WebRTC state
console.log('PC State:', pcRef.current?.connectionState)
console.log('DC State:', dcRef.current?.readyState)
console.log('Local tracks:', localStreamRef.current?.getTracks())

// Monitor data channel messages
dcRef.current.addEventListener('message', (event) => {
  console.log('DC Message:', JSON.parse(event.data))
})
```

### Common Issues
1. **No ephemeral key:** Check server session endpoint and OpenAI API key
2. **Audio not playing:** Verify audio element srcObject and browser autoplay policy
3. **Timer not stopping:** Ensure cleanup function clears intervals properly
4. **Persona not applying:** Check data channel readyState before sending updates
5. **Subject validation:** Oxbridge persona requires subject selection

## Extension Points

### Adding New Personas
1. Update `PersonaKey` type in `personas.ts`
2. Add configuration to `PERSONA_CONFIGS`
3. Implement persona-specific instruction builder
4. Update `buildInstructions` function
5. Test with rating system enabled/disabled

### Timer Enhancements
- **Custom durations:** Add text input for custom minute values
- **Pause/resume:** Implement timer pause functionality
- **Warning notifications:** Add sound or visual alerts at time milestones
- **Overtime mode:** Allow interviews to continue past timer expiration

### Audio Enhancements
- **Recording:** Capture full interview audio for playback
- **Transcription display:** Show real-time transcript of conversation
- **Audio visualization:** Add waveform or volume level indicators
- **Voice selection:** Allow users to choose from available OpenAI voices

This comprehensive documentation covers every aspect of the RealtimeInterview component, providing complete context for any developer to understand, maintain, and extend the system.