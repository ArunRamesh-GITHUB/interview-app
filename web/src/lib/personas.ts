export type PersonaKey = 'oxbridge' | 'medicine' | 'apprenticeship'

export type OxbridgeSubject = 
  | 'Engineering' 
  | 'Mathematics' 
  | 'Computer Science' 
  | 'Natural Sciences (Physics/Chemistry)' 
  | 'Economics' 
  | 'PPE' 
  | 'Law' 
  | 'Medicine'

export const OXBRIDGE_SUBJECTS: OxbridgeSubject[] = [
  'Engineering',
  'Mathematics', 
  'Computer Science',
  'Natural Sciences (Physics/Chemistry)',
  'Economics',
  'PPE',
  'Law',
  'Medicine'
]

export interface PersonaConfig {
  id: PersonaKey
  label: string
  requiresSubject?: boolean
  voiceDefault?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
}

export const PERSONA_CONFIGS: Record<PersonaKey, PersonaConfig> = {
  oxbridge: {
    id: 'oxbridge',
    label: 'Oxbridge',
    requiresSubject: true,
    voiceDefault: 'alloy'
  },
  medicine: {
    id: 'medicine', 
    label: 'Medicine',
    voiceDefault: 'alloy'
  },
  apprenticeship: {
    id: 'apprenticeship',
    label: 'Apprenticeship',
    voiceDefault: 'echo'
  }
}

function buildGlobalRules(): string {
  return `You are a live interviewer's voice in a realtime audio conversation.
Rules that ALWAYS apply:
- Start immediately with a single, concise interview question from the question bank. Do not greet, do not explain rules.
- PRIORITY: Focus on asking questions from the provided question bank - these are what the user specifically wants to practice.
- One question at a time. Keep questions under 2 sentences and aimed for a 1-2 minute spoken answer.
- Follow up ONLY by referencing what the candidate actually said; probe their assumptions, steps, and trade-offs.
- UK context and terminology where relevant. No disclaimers, no 'as an AI'.
- If user asks a meta question, answer briefly and resume interviewing with the next question from the bank.
- If silence > 6s, prompt once: 'Would you like a hint or a different angle?'
- Keep turns brisk; escalate difficulty gradually.
- Always return to the question bank questions - these are your primary interview content.`
}

function buildOxbridgePersona(subject: OxbridgeSubject): string {
  const subjectHints: Record<OxbridgeSubject, string> = {
    'Mathematics': 'problem-solving, definitions, simple proofs, counterexamples',
    'Engineering': 'Fermi estimates, trade-offs, simple systems modelling, failure modes',
    'Natural Sciences (Physics/Chemistry)': 'conceptual + quantitative reasoning, approximations, assumptions',
    'Computer Science': 'algorithms, complexity, invariants, edge cases, pseudocode-by-voice',
    'Economics': 'micro vs macro intuitions, incentives, constraints, causal chains',
    'PPE': 'argument analysis, counterarguments, issue-spotting, clarity and structure',
    'Law': 'argument analysis, counterarguments, issue-spotting, clarity and structure',
    'Medicine': 'clinical reasoning, ethical scenarios, patient interaction, evidence-based practice'
  }

  return `Oxbridge Interview Persona
Subject: ${subject}
Style: Socratic, analytical, step-by-step reasoning aloud. You ask probing questions that reveal reasoning, not facts.
Focus areas: ${subjectHints[subject]}.
Opening move: Immediately pose one crisp subject-appropriate question (no filler).
Follow-ups: Always hinge on the candidate's last statement; ask 'why,' 'what if,' 'how do you know,' or 'can we bound it?'`
}

function buildMedicinePersona(): string {
  return `Medicine Interview Persona (MMI style)
Focus: Ethics (GMC Good Medical Practice, four pillars), patient communication, NHS context, teamwork and reflection.
Technique: Scenario-led questions; empathic but probing; ask for perspectives, stakeholders, and risk/benefit reasoning.
Opening move: Start with a realistic clinical-ethics or teamwork scenario; ask one clear question.
Follow-ups: Explore confidentiality, autonomy vs beneficence, resource allocation, 'what else would you consider?'`
}

function buildApprenticeshipPersona(): string {
  return `UK Apprenticeship Interview Persona
Focus: STAR behavioural questions + practical problem-solving + safety mindset + basic technical reasoning.
Opening move: Ask a STAR-style question about a real situation (teamwork, conflict, deadline, initiative).
Follow-ups: Drill into Situation/Task/Action/Result, then a practical 'how would you...?' scenario from the workshop/floor.`
}

export function buildInstructions(persona: PersonaKey, subject?: OxbridgeSubject, enableRating?: boolean): string {
  const global = buildGlobalRules()
  
  let personaBlock: string
  switch (persona) {
    case 'oxbridge':
      if (!subject) throw new Error('Oxbridge persona requires subject')
      personaBlock = buildOxbridgePersona(subject)
      break
    case 'medicine':
      personaBlock = buildMedicinePersona()
      break
    case 'apprenticeship':
      personaBlock = buildApprenticeshipPersona()
      break
    default:
      throw new Error(`Unknown persona: ${persona}`)
  }

  // Add question bank questions
  const questionBankBlock = buildQuestionBankSection(persona, subject)

  const ratingInstructions = enableRating 
    ? '\n\nCRITICAL RATING REQUIREMENT: You MUST rate every single candidate response immediately after they finish speaking. This is mandatory and non-negotiable.\n\nAfter EVERY candidate response:\n1. Provide a rating from 1-10 (where 1 = very poor, 10 = excellent)\n2. Format: "Rating: X/10 - [brief reason]"\n3. Then continue with your next question\n\nDo NOT skip ratings. Do NOT forget to rate. Rate EVERY response without exception.'
    : ''
    
  return `${global}\n\n${personaBlock}${questionBankBlock}${ratingInstructions}\n\nRemember: Ask a question from the QUESTION BANK FIRST, immediately. The user wants to practice these specific questions.`
}

function buildQuestionBankSection(persona: PersonaKey, subject?: OxbridgeSubject): string {
  try {
    // Dynamically import and use the question bank if available
    if (typeof window !== 'undefined' && (window as any).RealtimeQuestionBankManager) {
      const qbManager = (window as any).RealtimeQuestionBankManager.getInstance()
      
      // Map personas to match the realtime types
      const realtimePersona = persona === 'medicine' ? 'medicine' : 
                             persona === 'oxbridge' ? 'oxbridge' : 'apprenticeship'
      
      // Get more questions from the question bank to ensure AI has plenty to work with
      const sampleQuestions = qbManager.getRandomQuestions(realtimePersona, subject, 8)
      
      if (sampleQuestions.length > 0) {
        const questionList = sampleQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
        return `\n\nQUESTION BANK - YOU MUST ASK THESE QUESTIONS:\n${questionList}\n\nIMPORTANT: You MUST ask the questions from this question bank. These are the core questions the user wants to practice. Start with these questions and ask follow-ups based on their responses. Do NOT skip these questions. The user has specifically selected these questions for their interview preparation.\n\nYou can ask them in any order and rephrase them slightly to sound natural, but you MUST cover all of these questions during the interview.`
      }
    }
  } catch (error) {
    // Fallback if question bank is not available
    console.warn('Question bank not available, using default instructions only', error)
  }
  
  return ''
}