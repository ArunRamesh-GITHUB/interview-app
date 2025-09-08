// web/src/lib/realtimeQuestionBank.ts
export type RealtimePersonaKey = 'oxbridge' | 'medicine' | 'apprenticeship'
export type RealtimeOxbridgeSubject = 'Engineering' | 'Mathematics' | 'Computer Science' | 
  'Natural Sciences (Physics/Chemistry)' | 'Economics' | 'PPE' | 'Law' | 'Medicine'

export interface RealtimeQuestionBank {
  medicine: {
    questions: string[]
  }
  oxbridge: Record<RealtimeOxbridgeSubject, {
    questions: string[]
  }> & {
    common_questions: string[]
  }
  apprenticeship: {
    questions: string[]
  }
}

// Default question bank for realtime interviews
const DEFAULT_REALTIME_QUESTION_BANK: RealtimeQuestionBank = {
  medicine: {
    questions: [
      'A colleague consistently arrives late to shifts, affecting patient care. How would you address this situation?',
      'A patient refuses blood transfusion for religious reasons but needs it to save their life. What would you do?',
      'You notice a senior doctor making a medication error. How would you handle this?',
      'A patient asks you to hide their smoking habit from their family. What is your response?',
      'Describe how you would break bad news to a patient and their family.',
      'A patient cannot afford their prescribed medication. What options would you explore?'
    ]
  },
  oxbridge: {
    Engineering: {
      questions: [
        'How would you estimate the number of piano tuners in London?',
        'Why do bicycle wheels have spokes? What would happen if we removed half of them?',
        'Design a bridge that can support its own weight plus 1000 cars. What factors matter most?',
        'How would you improve the design of a paper clip?',
        'Estimate the energy required to heat all homes in the UK for one day.',
        'What determines the maximum speed of a car on a flat road?'
      ]
    },
    Mathematics: {
      questions: [
        'Prove that the square root of 2 is irrational.',
        'What is infinity? Can we have different sizes of infinity?',
        'How would you calculate pi to 10 decimal places using only basic operations?',
        'Is 0.999... equal to 1? Explain your reasoning.',
        'How many ways can you arrange the letters in MATHEMATICS?',
        'What happens when you add all positive integers? Does this make sense?'
      ]
    },
    'Computer Science': {
      questions: [
        'How would you explain what an algorithm is to a 5-year-old?',
        'Design a system to manage a library\'s book lending. What data structures would you use?',
        'Why might a computer program become slower over time even with the same input?',
        'How would you detect if someone is cheating in an online exam?',
        'Explain how the internet works in simple terms.',
        'What makes a password secure? How would you design a password checker?'
      ]
    },
    'Natural Sciences (Physics/Chemistry)': {
      questions: [
        'Why is the sky blue during the day but red during sunset?',
        'How would you measure the height of a building using only a barometer?',
        'Why does ice float on water? What if it didn\'t?',
        'Explain how a microwave oven heats food.',
        'Why do we see lightning before hearing thunder?',
        'How would you separate salt from seawater using minimal energy?'
      ]
    },
    Economics: {
      questions: [
        'Why do prices of concert tickets vary so much between different seats?',
        'Should the government provide free university education? Consider the economics.',
        'Why might a country benefit from trade even if it can produce everything more efficiently?',
        'How would you measure the success of an economy?',
        'Why do some people earn more than others? Is this fair?',
        'What would happen if everyone suddenly decided to save all their money?'
      ]
    },
    PPE: {
      questions: [
        'Is it ever acceptable to lie? Give examples and reasoning.',
        'Should voting be mandatory in a democracy? Discuss the trade-offs.',
        'How should society balance individual freedom with collective welfare?',
        'Is wealth inequality necessarily a bad thing? Why or why not?',
        'Should social media companies be allowed to censor content? Who decides what\'s acceptable?',
        'What makes a law legitimate? When, if ever, should laws be disobeyed?'
      ]
    },
    Law: {
      questions: [
        'Should judges consider the consequences of their decisions or only apply the law strictly?',
        'Is it fair to punish someone for a crime they intended to commit but couldn\'t complete?',
        'How should the law balance victim rights with defendant rights?',
        'Should corporations have the same rights as individuals? Why or why not?',
        'When should the law protect people from their own choices?',
        'How would you design a fair legal system from scratch?'
      ]
    },
    Medicine: {
      questions: [
        'A healthy person wants to donate a kidney to a stranger. Should this be allowed?',
        'How would you decide which patients get priority for limited ICU beds?',
        'Should experimental treatments be available to terminal patients before full testing?',
        'A patient with mental illness refuses treatment. When should you override their decision?',
        'How would you handle a case where patient preferences conflict with family wishes?',
        'Should healthcare be rationed by age? What about by lifestyle choices?'
      ]
    },
    common_questions: [
      'What would you do if you disagreed with an expert in your field?',
      'How do you know when you have enough evidence to make a decision?',
      'Describe something you believed was true but later changed your mind about.',
      'What is the most important question in your field and why?',
      'How would you explain your subject to someone from 500 years ago?',
      'What assumptions do we make in your field that might be wrong?'
    ]
  },
  apprenticeship: {
    questions: [
      'Tell me about a time you had to learn a new skill quickly under pressure.',
      'Describe a situation where you had to work with someone you found difficult.',
      'Give me an example of when you made a mistake and how you handled it.',
      'Tell me about a project you\'re proud of and what you learned from it.',
      'Describe a time when you had to prioritize multiple urgent tasks.',
      'How would you approach a technical problem you\'ve never encountered before?'
    ]
  }
}

const REALTIME_QUESTION_BANK_KEY = 'realtimeQuestionBank_v1'

export class RealtimeQuestionBankManager {
  private static instance: RealtimeQuestionBankManager
  private questionBank: RealtimeQuestionBank

  private constructor() {
    this.questionBank = this.loadFromStorage()
  }

  static getInstance(): RealtimeQuestionBankManager {
    if (!RealtimeQuestionBankManager.instance) {
      RealtimeQuestionBankManager.instance = new RealtimeQuestionBankManager()
    }
    return RealtimeQuestionBankManager.instance
  }

  private loadFromStorage(): RealtimeQuestionBank {
    try {
      const stored = localStorage.getItem(REALTIME_QUESTION_BANK_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return this.validateAndMergeWithDefaults(parsed)
      }
    } catch (error) {
      console.warn('Failed to load realtime question bank from storage, using defaults:', error)
    }
    return JSON.parse(JSON.stringify(DEFAULT_REALTIME_QUESTION_BANK))
  }

  private validateAndMergeWithDefaults(stored: any): RealtimeQuestionBank {
    const result = JSON.parse(JSON.stringify(DEFAULT_REALTIME_QUESTION_BANK))
    
    // Merge stored data with defaults
    if (stored.medicine && Array.isArray(stored.medicine.questions)) {
      result.medicine.questions = stored.medicine.questions
    }
    
    if (stored.apprenticeship && Array.isArray(stored.apprenticeship.questions)) {
      result.apprenticeship.questions = stored.apprenticeship.questions
    }
    
    if (stored.oxbridge) {
      if (Array.isArray(stored.oxbridge.common_questions)) {
        result.oxbridge.common_questions = stored.oxbridge.common_questions
      }
      
      // Handle each subject
      Object.keys(result.oxbridge).forEach(subject => {
        if (subject !== 'common_questions' && stored.oxbridge[subject] && 
            Array.isArray(stored.oxbridge[subject].questions)) {
          result.oxbridge[subject as RealtimeOxbridgeSubject].questions = stored.oxbridge[subject].questions
        }
      })
    }
    
    return result
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(REALTIME_QUESTION_BANK_KEY, JSON.stringify(this.questionBank))
    } catch (error) {
      console.error('Failed to save realtime question bank to storage:', error)
    }
  }

  getQuestions(persona: RealtimePersonaKey, subject?: RealtimeOxbridgeSubject): string[] {
    switch (persona) {
      case 'medicine':
        return this.questionBank.medicine.questions
      case 'apprenticeship':
        return this.questionBank.apprenticeship.questions
      case 'oxbridge':
        if (!subject) return this.questionBank.oxbridge.common_questions
        return [
          ...this.questionBank.oxbridge[subject].questions,
          ...this.questionBank.oxbridge.common_questions
        ]
      default:
        return []
    }
  }

  updateQuestions(persona: RealtimePersonaKey, questions: string[], subject?: RealtimeOxbridgeSubject): void {
    switch (persona) {
      case 'medicine':
        this.questionBank.medicine.questions = questions
        break
      case 'apprenticeship':
        this.questionBank.apprenticeship.questions = questions
        break
      case 'oxbridge':
        if (subject === undefined) {
          // Update common questions
          this.questionBank.oxbridge.common_questions = questions
        } else {
          this.questionBank.oxbridge[subject].questions = questions
        }
        break
    }
    this.saveToStorage()
  }

  addQuestion(persona: RealtimePersonaKey, question: string, subject?: RealtimeOxbridgeSubject): void {
    const questions = this.getQuestions(persona, subject)
    if (!questions.includes(question)) {
      if (persona === 'oxbridge' && subject === undefined) {
        this.questionBank.oxbridge.common_questions.push(question)
      } else if (persona === 'oxbridge' && subject) {
        this.questionBank.oxbridge[subject].questions.push(question)
      } else if (persona === 'medicine') {
        this.questionBank.medicine.questions.push(question)
      } else if (persona === 'apprenticeship') {
        this.questionBank.apprenticeship.questions.push(question)
      }
      this.saveToStorage()
    }
  }

  removeQuestion(persona: RealtimePersonaKey, index: number, subject?: RealtimeOxbridgeSubject): void {
    let targetArray: string[]
    
    if (persona === 'oxbridge' && subject === undefined) {
      targetArray = this.questionBank.oxbridge.common_questions
    } else if (persona === 'oxbridge' && subject) {
      targetArray = this.questionBank.oxbridge[subject].questions
    } else if (persona === 'medicine') {
      targetArray = this.questionBank.medicine.questions
    } else if (persona === 'apprenticeship') {
      targetArray = this.questionBank.apprenticeship.questions
    } else {
      return
    }
    
    if (index >= 0 && index < targetArray.length) {
      targetArray.splice(index, 1)
      this.saveToStorage()
    }
  }

  editQuestion(persona: RealtimePersonaKey, index: number, newQuestion: string, subject?: RealtimeOxbridgeSubject): void {
    let targetArray: string[]
    
    if (persona === 'oxbridge' && subject === undefined) {
      targetArray = this.questionBank.oxbridge.common_questions
    } else if (persona === 'oxbridge' && subject) {
      targetArray = this.questionBank.oxbridge[subject].questions
    } else if (persona === 'medicine') {
      targetArray = this.questionBank.medicine.questions
    } else if (persona === 'apprenticeship') {
      targetArray = this.questionBank.apprenticeship.questions
    } else {
      return
    }
    
    if (index >= 0 && index < targetArray.length) {
      targetArray[index] = newQuestion
      this.saveToStorage()
    }
  }

  resetToDefaults(): void {
    this.questionBank = JSON.parse(JSON.stringify(DEFAULT_REALTIME_QUESTION_BANK))
    this.saveToStorage()
  }

  getQuestionBank(): RealtimeQuestionBank {
    return JSON.parse(JSON.stringify(this.questionBank))
  }

  // Get random questions for instructions
  getRandomQuestions(persona: RealtimePersonaKey, subject?: RealtimeOxbridgeSubject, count: number = 3): string[] {
    const questions = this.getQuestions(persona, subject)
    if (questions.length <= count) return questions
    
    const shuffled = questions.slice().sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }
}