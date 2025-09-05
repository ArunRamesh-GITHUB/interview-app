export interface Resource {
  id: string | number
  title: string
  url: string
  category: 'Guides' | 'Past Questions' | 'Templates' | 'Videos' | 'Tools'
  description?: string
  is_premium?: boolean
}

export const resourcesData: Resource[] = [
  {
    id: 1,
    title: "STAR Method Framework",
    url: "https://example.com/star-method",
    category: "Guides",
    description: "Master the Situation, Task, Action, Result framework for behavioral interviews",
    is_premium: false
  },
  {
    id: 2,
    title: "50 Most Common Interview Questions",
    url: "https://example.com/common-questions",
    category: "Past Questions",
    description: "Comprehensive list of frequently asked interview questions with model answers",
    is_premium: true
  },
  {
    id: 3,
    title: "Interview Prep Checklist",
    url: "https://example.com/prep-checklist",
    category: "Templates",
    description: "Complete checklist to ensure you're fully prepared for any interview",
    is_premium: false
  },
  {
    id: 4,
    title: "Body Language Masterclass",
    url: "https://example.com/body-language-video",
    category: "Videos",
    description: "Learn how to project confidence and professionalism through body language",
    is_premium: true
  },
  {
    id: 5,
    title: "Salary Negotiation Calculator",
    url: "https://example.com/salary-calculator",
    category: "Tools",
    description: "Interactive tool to help you determine fair compensation for your role",
    is_premium: false
  },
  {
    id: 6,
    title: "Technical Interview Questions - Software Engineering",
    url: "https://example.com/tech-questions",
    category: "Past Questions",
    description: "Curated collection of technical questions asked at top tech companies",
    is_premium: true
  },
  {
    id: 7,
    title: "CV Template Collection",
    url: "https://example.com/cv-templates",
    category: "Templates",
    description: "Professional CV templates optimized for different industries",
    is_premium: false
  },
  {
    id: 8,
    title: "Interview Success Stories",
    url: "https://example.com/success-stories",
    category: "Videos",
    description: "Real candidates share their interview experiences and winning strategies",
    is_premium: false
  }
]
