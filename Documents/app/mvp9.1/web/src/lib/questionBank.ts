// web/src/lib/questionBank.ts
export type PersonaKey = 'medical' | 'oxbridge' | 'apprenticeship'
export type OxbridgeSubject = 'Engineering' | 'Mathematics' | 'Computer Science' | 'Natural Sciences (Physics)' | 
  'Natural Sciences (Chemistry)' | 'Economics' | 'PPE' | 'Law' | 'Medicine'

export interface QuestionBank {
  medical: {
    primary: string[]
    extra: string[]
  }
  oxbridge: Record<OxbridgeSubject, {
    primary: string[]
    extra: string[]
  }> & {
    common_extra: string[]
  }
  apprenticeship: {
    primary: string[]
    extra: string[]
  }
}

// Default question bank - this will be the initial data that populates localStorage
const DEFAULT_QUESTION_BANK: QuestionBank = {
  medical: {
    primary: [
      'Tell me about a time you showed empathy in a difficult situation.',
      'What are the four pillars of medical ethics and how do they apply to confidentiality?',
      'How would you approach a patient requesting treatment that you believe is not in their best interest?',
      'Describe a time you communicated complex information clearly to a non-expert.',
      'When is it appropriate to break confidentiality?',
      'How would you approach a patient refusing life-saving treatment?'
    ],
    extra: [
      'Give an example of teamwork in a stressful setting. What was your role?',
      'How would you handle a mistake you made that didn\'t harm the patient?',
      'What biases might affect clinical decision-making and how do you mitigate them?',
      'How do you balance patient autonomy with public health concerns?',
      'How do false positives/negatives affect screening decisions?',
      'Explain informed consent and capacity with a scenario.',
      'How would you approach a patient requesting antibiotics unnecessarily?',
      'When is shared decision-making most valuable?',
      'What makes clinical trials ethically acceptable?'
    ]
  },
  oxbridge: {
    Engineering: {
      primary: [
        'What limits the maximum height of a skyscraper? Discuss materials and stability.',
        'How does the efficiency of a jet engine vary with altitude and why?',
        'Describe how you would estimate the drag coefficient of a small object using household items.',
        'How would you design a simple, low-cost water filtration device?',
        'What trade-offs drive the choice between steel and composites in aircraft?'
      ],
      extra: [
        'Estimate the power needed to cycle up a hill at constant speed.',
        'How would you model heat loss from a small building?',
        'What failure modes would you consider when designing a bridge?',
        'How would you design a bridge to withstand earthquakes?',
        'What factors determine the efficiency of a wind turbine?'
      ]
    },
    Mathematics: {
      primary: [
        'Does a continuous differentiable function with infinitely many points where f\'(x)=0 have to be constant? Explain.',
        'How many integers between 1 and 10^6 are square-free? Sketch an approach.',
        'State and discuss the idea behind the pigeonhole principle with a non-trivial example.',
        'Give an example where a sequence converges but not absolutely. Explain.',
        'Sketch an argument for why there are infinitely many primes.'
      ],
      extra: [
        'Construct a function that is continuous everywhere but differentiable nowhere (idea only).',
        'What is the significance of eigenvalues in linear transformations?',
        'How would you bound an error term in an approximation?',
        'Explain the concept of mathematical induction with a creative example.',
        'What makes a proof by contradiction effective?'
      ]
    },
    'Computer Science': {
      primary: [
        'Explain why comparison sorting cannot be faster than O(n log n) in the worst case.',
        'How would you detect a cycle in a linked list? Discuss time/space trade-offs.',
        'What is a minimal spanning tree and where is it useful?',
        'Compare BFS and DFS: when does each excel?',
        'Explain amortised analysis with an example.'
      ],
      extra: [
        'How would you design a hash function to reduce collisions?',
        'Trade-offs between recursion and iteration — give concrete cases.',
        'Outline how consensus is reached in a distributed system.',
        'How would you design a cache replacement algorithm?',
        'Explain the difference between P and NP with examples.'
      ]
    },
    'Natural Sciences (Physics)': {
      primary: [
        'Why is the sky blue? Give a rigorous explanation and assumptions involved.',
        'How would you estimate the thickness of the atmosphere from first principles?',
        'What factors limit the range of an electric vehicle?',
        'How would you estimate the energy consumption of a smartphone over a day?',
        'What limits the resolution of an optical microscope?'
      ],
      extra: [
        'Explain terminal velocity and how you would measure it experimentally.',
        'Sketch how you would estimate the mass of the Earth.',
        'How do superconductors change electromagnetic behaviour?',
        'What determines the maximum efficiency of a solar cell?',
        'How would you measure the speed of light using simple equipment?'
      ]
    },
    'Natural Sciences (Chemistry)': {
      primary: [
        'Why does ice float on water? Explain in molecular terms.',
        'Discuss the trade-offs between heterogeneous and homogeneous catalysis.',
        'How would you estimate the pH of rainwater in an unpolluted environment?',
        'What factors influence reaction rate in a gas-phase reaction?',
        'How would you separate two compounds with similar boiling points?'
      ],
      extra: [
        'Explain Le Chatelier\'s principle with a non-trivial example.',
        'How do catalysts affect activation energy and reaction pathway?',
        'What makes a good electrolyte solution?',
        'How would you determine the structure of an unknown organic compound?',
        'Explain why some reactions are spontaneous but slow.'
      ]
    },
    Economics: {
      primary: [
        'Explain the difference between nominal and real GDP, and why the distinction matters.',
        'When and why do price controls cause shortages? Provide a historical example.',
        'How would you test whether a market is competitive?',
        'How do externalities justify government intervention?',
        'Why might GDP growth not reflect welfare improvements?'
      ],
      extra: [
        'What mechanisms reduce moral hazard in insurance?',
        'How does asymmetric information distort markets?',
        'What are the costs and benefits of a minimum wage?',
        'How do central banks influence economic activity?',
        'Explain the concept of economic equilibrium with real-world examples.'
      ]
    },
    PPE: {
      primary: [
        'Should free speech include speech that is clearly false? Discuss policy trade-offs.',
        'How can we measure inequality in a society?',
        'What does "utility" mean in economics and what are its limitations?',
        'When is civil disobedience justified?',
        'What trade-offs arise between liberty and security?'
      ],
      extra: [
        'How should policymakers handle uncertainty in evidence?',
        'Can democracy conflict with expertise? Discuss.',
        'Does equality of opportunity require redistribution? Why/why not?',
        'What makes a political system legitimate?',
        'How should we balance individual rights with collective welfare?'
      ]
    },
    Law: {
      primary: [
        'Should intention matter more than outcome when determining criminal liability?',
        'Explain the principle of stare decisis and its advantages/disadvantages.',
        'When is it justified to limit an individual\'s liberty?',
        'How should courts balance privacy with public interest?',
        'When, if ever, is strict liability fair?'
      ],
      extra: [
        'What are the limits of freedom of expression in law?',
        'How do precedent and innovation interact in legal reasoning?',
        'Should rehabilitation outweigh retribution in sentencing?',
        'What makes evidence admissible in court?',
        'How should law adapt to technological change?'
      ]
    },
    Medicine: {
      primary: [
        'Explain clinical reasoning behind investigating chest pain in a 55-year-old.',
        'How do you weigh autonomy versus beneficence in end-of-life care?',
        'What is a randomized controlled trial and why is it important?',
        'How do false positives/negatives affect screening decisions?',
        'Explain informed consent and capacity with a scenario.'
      ],
      extra: [
        'How would you approach a patient requesting antibiotics unnecessarily?',
        'When is shared decision-making most valuable?',
        'What makes clinical trials ethically acceptable?',
        'How do you handle uncertainty in medical diagnosis?',
        'What role does evidence-based medicine play in clinical practice?'
      ]
    },
    common_extra: [
      'Explain how you would design a fair experiment to test a hypothesis of your choice.',
      'Discuss a time you changed your mind after encountering new evidence.',
      'How do you decide when a model is "good enough" for prediction?',
      'What assumptions underlie your favourite result, and what breaks if they fail?',
      'Argue for or against simplicity as a scientific virtue.',
      'How do you approach problems with incomplete information?',
      'What makes an explanation satisfying to you?'
    ]
  },
  apprenticeship: {
    primary: [
      'Tell me about your favourite project — what did you build and why?',
      'Describe a time you handled a setback on a technical task. What did you change?',
      'How do you prioritise tasks when deadlines collide?',
      'Tell me about a time you improved a process — what changed?',
      'Describe a hands-on project where you had to learn a new tool quickly.'
    ],
    extra: [
      'When you hit a blocker, how do you get unstuck?',
      'How do you decide between speed and quality under pressure?',
      'Give an example of receiving difficult feedback and what you did with it.',
      'How do you stay current with technology trends in your field?',
      'Describe a time you had to explain a technical concept to a non-technical person.',
      'How do you approach debugging a complex problem?',
      'What\'s your process for learning a new programming language or framework?'
    ]
  }
}

const QUESTION_BANK_KEY = 'questionBank_v1'

export class QuestionBankManager {
  private static instance: QuestionBankManager
  private questionBank: QuestionBank

  private constructor() {
    this.questionBank = this.loadFromStorage()
  }

  static getInstance(): QuestionBankManager {
    if (!QuestionBankManager.instance) {
      QuestionBankManager.instance = new QuestionBankManager()
    }
    return QuestionBankManager.instance
  }

  private loadFromStorage(): QuestionBank {
    try {
      const stored = localStorage.getItem(QUESTION_BANK_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate the structure and fill in any missing parts
        return this.validateAndMergeWithDefaults(parsed)
      }
    } catch (error) {
      console.warn('Failed to load question bank from storage, using defaults:', error)
    }
    return JSON.parse(JSON.stringify(DEFAULT_QUESTION_BANK))
  }

  private validateAndMergeWithDefaults(stored: any): QuestionBank {
    const result = JSON.parse(JSON.stringify(DEFAULT_QUESTION_BANK))
    
    // Merge stored data with defaults
    if (stored.medical) {
      result.medical.primary = Array.isArray(stored.medical.primary) ? stored.medical.primary : result.medical.primary
      result.medical.extra = Array.isArray(stored.medical.extra) ? stored.medical.extra : result.medical.extra
    }
    
    if (stored.apprenticeship) {
      result.apprenticeship.primary = Array.isArray(stored.apprenticeship.primary) ? stored.apprenticeship.primary : result.apprenticeship.primary
      result.apprenticeship.extra = Array.isArray(stored.apprenticeship.extra) ? stored.apprenticeship.extra : result.apprenticeship.extra
    }
    
    if (stored.oxbridge) {
      if (Array.isArray(stored.oxbridge.common_extra)) {
        result.oxbridge.common_extra = stored.oxbridge.common_extra
      }
      
      // Handle each subject
      Object.keys(result.oxbridge).forEach(subject => {
        if (subject !== 'common_extra' && stored.oxbridge[subject]) {
          if (Array.isArray(stored.oxbridge[subject].primary)) {
            result.oxbridge[subject as OxbridgeSubject].primary = stored.oxbridge[subject].primary
          }
          if (Array.isArray(stored.oxbridge[subject].extra)) {
            result.oxbridge[subject as OxbridgeSubject].extra = stored.oxbridge[subject].extra
          }
        }
      })
    }
    
    return result
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(this.questionBank))
    } catch (error) {
      console.error('Failed to save question bank to storage:', error)
    }
  }

  getQuestions(persona: PersonaKey, subject?: OxbridgeSubject): { primary: string[], extra: string[] } {
    switch (persona) {
      case 'medical':
        return this.questionBank.medical
      case 'apprenticeship':
        return this.questionBank.apprenticeship
      case 'oxbridge':
        if (!subject) subject = 'Engineering' // default fallback
        return {
          primary: this.questionBank.oxbridge[subject].primary,
          extra: [...this.questionBank.oxbridge[subject].extra, ...this.questionBank.oxbridge.common_extra]
        }
      default:
        return { primary: [], extra: [] }
    }
  }

  updateQuestions(persona: PersonaKey, type: 'primary' | 'extra', questions: string[], subject?: OxbridgeSubject): void {
    switch (persona) {
      case 'medical':
        this.questionBank.medical[type] = questions
        break
      case 'apprenticeship':
        this.questionBank.apprenticeship[type] = questions
        break
      case 'oxbridge':
        if (type === 'extra' && subject === undefined) {
          // Update common extra questions
          this.questionBank.oxbridge.common_extra = questions
        } else if (subject) {
          this.questionBank.oxbridge[subject][type] = questions
        }
        break
    }
    this.saveToStorage()
  }

  addQuestion(persona: PersonaKey, type: 'primary' | 'extra', question: string, subject?: OxbridgeSubject): void {
    const questions = this.getQuestions(persona, subject)
    const targetArray = type === 'primary' ? questions.primary : questions.extra
    if (!targetArray.includes(question)) {
      targetArray.push(question)
      this.updateQuestions(persona, type, targetArray, subject)
    }
  }

  removeQuestion(persona: PersonaKey, type: 'primary' | 'extra', index: number, subject?: OxbridgeSubject): void {
    const questions = this.getQuestions(persona, subject)
    const targetArray = type === 'primary' ? questions.primary : questions.extra
    if (index >= 0 && index < targetArray.length) {
      targetArray.splice(index, 1)
      this.updateQuestions(persona, type, targetArray, subject)
    }
  }

  editQuestion(persona: PersonaKey, type: 'primary' | 'extra', index: number, newQuestion: string, subject?: OxbridgeSubject): void {
    const questions = this.getQuestions(persona, subject)
    const targetArray = type === 'primary' ? questions.primary : questions.extra
    if (index >= 0 && index < targetArray.length) {
      targetArray[index] = newQuestion
      this.updateQuestions(persona, type, targetArray, subject)
    }
  }

  resetToDefaults(): void {
    this.questionBank = JSON.parse(JSON.stringify(DEFAULT_QUESTION_BANK))
    this.saveToStorage()
  }

  getQuestionBank(): QuestionBank {
    return JSON.parse(JSON.stringify(this.questionBank))
  }

  // Helper method for building question queues (similar to the original buildPrimaryQueue function)
  buildQuestionQueue(persona: PersonaKey, subject: OxbridgeSubject, maxRounds: number): string[] {
    const { primary, extra } = this.getQuestions(persona, subject)
    
    if (primary.length >= maxRounds) {
      return this.shuffle(primary).slice(0, maxRounds)
    }
    
    const combined = this.shuffle([...primary, ...extra])
    while (combined.length < maxRounds) {
      combined.push(...extra)
    }
    return combined.slice(0, maxRounds)
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}