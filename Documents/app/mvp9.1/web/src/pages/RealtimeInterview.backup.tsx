import React from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../lib/auth'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

type ConversationItem = {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function RealtimeInterview() {
  const { user } = useAuth()
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('disconnected')
  const [conversation, setConversation] = React.useState<ConversationItem[]>([])
  const [isListening, setIsListening] = React.useState(false)
  const [currentTranscript, setCurrentTranscript] = React.useState('')
  const [error, setError] = React.useState('')

  // WebSocket and audio refs
  const wsRef = React.useRef<WebSocket | null>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const microphoneRef = React.useRef<MediaStream | null>(null)
  const recognitionRef = React.useRef<any>(null)

  React.useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const connect = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }

    setConnectionState('connecting')
    setError('')

    try {
      // Get ephemeral token from our server
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: 'You are a helpful AI assistant. Respond naturally and conversationally.',
          voice: 'alloy'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get session token')
      }

      const { client_secret } = await response.json()
      
      // Connect to OpenAI WebSocket using ephemeral token as query parameter
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17&authorization=Bearer%20${encodeURIComponent(client_secret)}`
      console.log('🔗 Connecting to WebSocket:', wsUrl.replace(client_secret, '[TOKEN]'))
      
      const ws = new WebSocket(wsUrl)
      
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔗 Connected to OpenAI Realtime API')
        setConnectionState('connected')
        
        // Configure the session (token already in URL)
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        }))
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('📨 Received:', message.type, message)
        
        switch (message.type) {
          case 'error':
            console.error('❌ OpenAI Error:', message.error)
            setError(`OpenAI Error: ${message.error.message}`)
            break
            
          case 'session.created':
            console.log('✅ Session created successfully')
            break
            
          case 'input_audio_buffer.speech_started':
            console.log('🎤 Speech started')
            break
            
          case 'input_audio_buffer.speech_stopped':
            console.log('🎤 Speech stopped')
            break
            
          case 'conversation.item.input_audio_transcription.completed':
            const userText = message.transcript
            console.log('📝 User transcript:', userText)
            setConversation(prev => [...prev, {
              id: `user-${Date.now()}`,
              type: 'user',
              content: userText,
              timestamp: Date.now()
            }])
            break
            
          case 'response.audio.delta':
            // Handle audio chunks
            playAudioChunk(message.delta)
            break
            
          case 'response.text.delta':
            // Handle text response
            updateAssistantMessage(message.delta)
            break
            
          case 'response.text.done':
            // Finalize assistant message
            finalizeAssistantMessage(message.text)
            break
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setError('Connection error')
        setConnectionState('error')
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setConnectionState('disconnected')
      }

    } catch (err: any) {
      console.error('❌ Connection failed:', err)
      setError(err.message || 'Failed to connect')
      setConnectionState('error')
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop())
      microphoneRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    setConnectionState('disconnected')
    setIsListening(false)
  }

  const startListening = async () => {
    if (connectionState !== 'connected' || !wsRef.current) return

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneRef.current = stream
      
      // Set up audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      processor.onaudioprocess = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
        
        const inputData = event.inputBuffer.getChannelData(0)
        const pcm16Data = new Int16Array(inputData.length)
        
        // Convert float32 to int16 PCM
        for (let i = 0; i < inputData.length; i++) {
          pcm16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
        }
        
        // Send audio data to OpenAI
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: arrayBufferToBase64(pcm16Data.buffer)
        }))
      }
      
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      setIsListening(true)
      console.log('🎤 Started listening')
      
    } catch (err) {
      console.error('❌ Microphone access failed:', err)
      setError('Microphone access denied')
    }
  }

  const stopListening = () => {
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop())
      microphoneRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // Commit the audio buffer and request response
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }))
      
      wsRef.current.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio']
        }
      }))
    }
    
    setIsListening(false)
    console.log('🎤 Stopped listening')
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Helper functions
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
    return btoa(binary)
  }

  const playAudioChunk = (base64Audio: string) => {
    // TODO: Implement audio playback
    console.log('🔊 Received audio chunk:', base64Audio.length, 'characters')
  }

  const updateAssistantMessage = (delta: string) => {
    setConversation(prev => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage && lastMessage.type === 'assistant') {
        // Update existing message
        return prev.slice(0, -1).concat({
          ...lastMessage,
          content: lastMessage.content + delta
        })
      } else {
        // Create new message
        return [...prev, {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: delta,
          timestamp: Date.now()
        }]
      }
    })
  }

  const finalizeAssistantMessage = (text: string) => {
    setConversation(prev => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage && lastMessage.type === 'assistant') {
        return prev.slice(0, -1).concat({
          ...lastMessage,
          content: text
        })
      }
      return prev
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Realtime NailIT Interview</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' ? 'bg-yellow-500' :
              connectionState === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionState === 'connected' ? 'Connected' :
               connectionState === 'connecting' ? 'Connecting...' :
               connectionState === 'error' ? 'Error' :
               'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {connectionState === 'disconnected' && (
              <Button onClick={connect} disabled={!user}>
                Connect
              </Button>
            )}
            {connectionState === 'connected' && (
              <>
                <Button 
                  onClick={toggleListening}
                  className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {isListening ? '🔴 Stop' : '🎤 Talk'}
                </Button>
                <Button variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {!user && (
            <div className="text-sm text-gray-600">
              Please sign in to use the Realtime AI
            </div>
          )}

          {currentTranscript && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Live transcript:</div>
              <div className="text-sm text-blue-800">{currentTranscript}</div>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="border rounded-lg p-4 bg-white min-h-[400px]">
          <h3 className="font-medium mb-3">Conversation</h3>
          <div className="space-y-3">
            {conversation.length === 0 ? (
              <div className="text-sm text-gray-500">
                Connect and start talking to begin the conversation.
              </div>
            ) : (
              conversation.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg ${
                  item.type === 'user' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={item.type === 'user' ? 'default' : 'secondary'}>
                      {item.type === 'user' ? '👤 You' : '🤖 AI'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{item.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}