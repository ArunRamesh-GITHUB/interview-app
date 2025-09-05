import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InterviewHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function InterviewHero({ className, ...props }: InterviewHeroProps) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [liveScore, setLiveScore] = React.useState(64)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsRecording(prev => !prev)
    }, 2000)

    const scoreInterval = setInterval(() => {
      setLiveScore(prev => Math.floor(Math.random() * 20) + 60)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(scoreInterval)
    }
  }, [])

  return (
    <section 
      className={cn(
        'w-full bg-surface relative overflow-hidden',
        'px-4 py-8 md:py-12 lg:py-16',
        className
      )} 
      {...props}
    >
      
      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Main Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="block text-white">Join Students Who Land Offers</span>
                <span className="block text-primary">Start Tutoring Today</span>
              </h1>
              
              <p className="text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed">
                Work 1-to-1 with an expert for your exact course or role. 
                Sessions recorded, scored by AI, and turned into drills 
                you can practice anytime.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="pt-4 space-y-4">
              {/* Mobile: Primary Live Interview Button */}
              <div className="block sm:hidden">
                <button
                  onClick={() => window.location.href = '/live'}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-3 px-8 py-4',
                    'bg-orange-500 hover:bg-orange-600 text-white',
                    'rounded-xl font-bold text-lg',
                    'transition-all duration-300 transform hover:scale-105',
                    'shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/50'
                  )}
                >
                  🎤 Start Live Interview
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </div>
              
              {/* Desktop & Mobile: Secondary buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => window.location.href = '/tutoring'}
                  className={cn(
                    'inline-flex items-center gap-3 px-8 py-4',
                    'bg-secondary hover:bg-secondary/80 text-white',
                    'rounded-xl font-semibold text-lg',
                    'transition-all duration-300 transform hover:scale-105',
                    'shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-secondary/50',
                    'hidden sm:inline-flex' // Hide on mobile since we have the Live Interview button above
                  )}
                >
                  Find Your Tutor
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => window.location.href = '/tutoring'}
                  className={cn(
                    'inline-flex items-center gap-3 px-8 py-4',
                    'bg-secondary hover:bg-secondary/80 text-white',
                    'rounded-xl font-semibold text-lg',
                    'transition-all duration-300 transform hover:scale-105',
                    'shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-secondary/50',
                    'block sm:hidden' // Only show on mobile as secondary button
                  )}
                >
                  Find Your Tutor
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => window.location.href = '/plans'}
                  className={cn(
                    'inline-flex items-center gap-3 px-8 py-4',
                    'bg-transparent hover:bg-surface-alt text-text-primary border-2 border-border hover:border-primary',
                    'rounded-xl font-semibold text-lg',
                    'transition-all duration-300 transform hover:scale-105',
                    'focus:outline-none focus:ring-4 focus:ring-primary/20'
                  )}
                >
                  Upgrade Your Plan
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Rating and features */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-text-secondary text-sm">4.8/5 average rating</span>
              </div>
              
              <div className="text-text-secondary text-sm">
                <span className="inline-block">Hundreds of mock interviews run</span>
              </div>
            </div>
          </div>

          {/* Right Column - Success Visualization */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              
              {/* Main Success Stats Card */}
              <div className="bg-card rounded-3xl p-8 shadow-level-3 border border-border w-full mb-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">Success Rate</h3>
                  <div className="text-4xl font-bold text-primary mb-2">92%</div>
                  <p className="text-text-secondary text-sm">Students land their dream role</p>
                </div>
                
                {/* Progress Metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Interview Confidence</span>
                    <span className="text-text-primary font-semibold">+85%</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-[85%] transition-all duration-1000"></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Technical Skills</span>
                    <span className="text-text-primary font-semibold">+78%</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-[78%] transition-all duration-1000" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">Communication</span>
                    <span className="text-text-primary font-semibold">+91%</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-[91%] transition-all duration-1000" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial Preview */}
              <div className="bg-card rounded-2xl p-6 shadow-level-2 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">E</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-text-primary text-sm">Evan M.</h4>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      "Got my dream uni place! The 1-to-1 sessions were game-changing."
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Floating achievement badges */}
              <div className="absolute -top-6 -right-4 bg-primary/20 backdrop-blur-sm rounded-full p-3 animate-pulse">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              
              <div className="absolute -bottom-4 -left-6 bg-secondary/10 backdrop-blur-sm rounded-full p-4 animate-pulse" style={{animationDelay: '1.5s'}}>
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}