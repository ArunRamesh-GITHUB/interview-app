// OpenAI Realtime API WebSocket client
export type RealtimeEvent = {
  type: string
  [key: string]: any
}

export type RealtimeClientConfig = {
  apiKey?: string
  sessionUrl?: string
  onMessage?: (event: RealtimeEvent) => void
  onError?: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export class RealtimeClient {
  private ws: WebSocket | null = null
  private config: RealtimeClientConfig
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  
  constructor(config: RealtimeClientConfig) {
    this.config = config
  }

  async connect() {
    if (this.connected) return

    try {
      // Get ephemeral token from our server
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: 'You are an AI interview assistant. Conduct professional interviews and ask thoughtful questions.',
          voice: 'alloy'
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Session creation failed:', response.status, errorText)
        let errorDetail = response.statusText
        try {
          const errorJson = JSON.parse(errorText)
          errorDetail = errorJson.detail || errorJson.error || errorText
        } catch {
          errorDetail = errorText || response.statusText
        }
        throw new Error(`Failed to create realtime session: ${errorDetail}`)
      }

      const { client_secret, model } = await response.json()
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model || 'gpt-4o-mini-realtime-preview-2024-12-17'}`

      this.ws = new WebSocket(wsUrl, ['realtime', `openai-insecure-api-key.${client_secret}`])
      
      this.ws.onopen = () => {
        console.log('🎤 Connected to OpenAI Realtime API')
        this.connected = true
        this.reconnectAttempts = 0
        this.config.onConnected?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeEvent = JSON.parse(event.data)
          this.config.onMessage?.(message)
        } catch (error) {
          console.error('Error parsing realtime message:', error)
          this.config.onError?.(error as Error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('🎤 Disconnected from OpenAI Realtime API', event.code, event.reason)
        this.connected = false
        this.config.onDisconnected?.()
        
        // Auto-reconnect on unexpected disconnections
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
          setTimeout(() => this.connect(), 2000 * this.reconnectAttempts)
        }
      }

      this.ws.onerror = (error) => {
        console.error('🎤 WebSocket error:', error)
        this.config.onError?.(new Error('WebSocket connection error'))
      }
    } catch (error) {
      console.error('Failed to connect to realtime API:', error)
      this.config.onError?.(error as Error)
      throw error
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
      this.connected = false
    }
  }

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN
  }

  send(event: RealtimeEvent) {
    if (!this.isConnected()) {
      console.warn('Cannot send message: not connected to realtime API')
      return false
    }

    try {
      this.ws!.send(JSON.stringify(event))
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      this.config.onError?.(error as Error)
      return false
    }
  }

  // High-level methods for common operations
  startConversation(persona: string, subject?: string, cvText?: string) {
    const instructions = this.buildInstructions(persona, subject, cvText)
    
    this.send({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        tools: [
          {
            type: 'function',
            name: 'score_answer',
            description: 'Score a candidate answer and save it to the database',
            parameters: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                answer: { type: 'string' },
                score: { type: 'number', minimum: 0, maximum: 100 },
                band: { type: 'string' },
                summary: { type: 'string' },
                strengths: { type: 'array', items: { type: 'string' } },
                improvements: { type: 'array', items: { type: 'string' } }
              },
              required: ['question', 'answer', 'score', 'band']
            }
          }
        ]
      }
    })
  }

  private buildInstructions(persona: string, subject?: string, cvText?: string): string {
    let baseInstructions = `You are an AI interview assistant conducting a ${persona} interview.`
    
    if (persona === 'medical') {
      baseInstructions += ` Focus on medical ethics, empathy, communication skills, and problem-solving in healthcare contexts. Ask probing questions about patient care, ethical dilemmas, and clinical reasoning.`
    } else if (persona === 'oxbridge') {
      baseInstructions += ` Conduct an Oxbridge-style ${subject} interview. Ask challenging analytical questions, probe deeper into reasoning, and test critical thinking skills. Be intellectually rigorous but supportive.`
    } else if (persona === 'apprenticeship') {
      baseInstructions += ` Focus on practical skills, technical projects, problem-solving ability, and workplace readiness. Ask about hands-on experience and how they handle real-world challenges.`
    }

    if (cvText) {
      baseInstructions += `\n\nCandidate's CV/Background:\n${cvText}`
    }

    baseInstructions += `\n\nConversation Guidelines:
- Ask one question at a time and wait for their complete answer
- Follow up with probing questions based on their responses  
- Use natural, conversational tone but maintain professionalism
- After each substantive answer, call the score_answer function to evaluate their response
- Keep questions focused and don't let the conversation drift
- Challenge assumptions and ask for specific examples
- Maintain the interview flow naturally`

    return baseInstructions
  }

  enableMicrophone() {
    this.send({
      type: 'input_audio_buffer.clear'
    })
  }

  disableMicrophone() {
    this.send({
      type: 'input_audio_buffer.clear'
    })
  }

  addUserMessage(text: string) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    })
    
    this.send({ type: 'response.create' })
  }

  interruptResponse() {
    this.send({ type: 'response.cancel' })
  }
}