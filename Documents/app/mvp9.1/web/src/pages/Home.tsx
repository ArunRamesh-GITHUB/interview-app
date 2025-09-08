import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../layouts'
import { Home as HomeIcon, Mic, MessageSquare, Upload, Archive, BookOpen, CreditCard, CheckCircle, RefreshCw, Bot, Pen, Library, File } from 'lucide-react'
import { useDashboardData } from '../lib/useDashboardData'
import { BarChart } from '../components/ui/bar-chart'
import { InterviewHero } from '../components/ui'


const features = [
  {to:'/live', title:'Live Interview', body:'Simulated interview, TTS reads questions, record and get scored.', icon: '🎤', featured: true},
  {to:'/realtime', title:'🔥 Realtime NailIT Interview', body:'NEW! Natural conversation with AI - interruptions, real-time scoring, most realistic experience.', icon: '⚡', featured: true},
  {to:'/drill', title:'Drill Questions', body:'Practise individual questions, improve and rescore.', icon: '💪'},
  {to:'/cv', title:'CV Upload', body:'Paste or upload CV text to personalise feedback.', icon: '📄'},
  {to:'/answers', title:'My Answers', body:'View and review all your past attempts.', icon: '📚'},
  {to:'/tutoring', title:'Tutoring', body:'Connect with expert tutors and access curated resources.', icon: '👥'},
]

export default function Home(){
  const dashboardData = useDashboardData()
  
  // Show loading state
  if (dashboardData.loading) {
    return (
      <>
        <InterviewHero />
        
        {/* Interview Modes Section - Full Width */}
        <div className="w-full bg-surface px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <section className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
                Choose Your Interview Mode
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <Link to={feature.to} key={feature.to}>
                    <Card 
                      className={`hover:shadow-level-3 hover:-translate-y-2 transition-all duration-300 h-full ${
                        feature.featured ? 'border-primary shadow-level-2 scale-105' : ''
                      }`}
                      variant={feature.featured ? 'lavender' : 'default'}
                    >
                      <CardHeader className="pb-6 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                            feature.featured ? 'bg-primary/10' : 'bg-surface-alt'
                          }`}>
                            <span className="text-4xl">{feature.icon}</span>
                          </div>
                          <CardTitle className="text-xl font-bold">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-8">
                        <p className="text-text-secondary leading-relaxed text-center">
                          {feature.body}
                        </p>
                        {feature.featured && (
                          <div className="mt-6 flex justify-center">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                              Most Popular
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
        
        {/* Dashboard Overview Section */}
        <div className="w-full bg-surface px-4 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 bg-card rounded-2xl p-6 shadow-level-2 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">U</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">Ready to practice?</h3>
                  <p className="text-text-secondary text-sm">Loading your progress...</p>
                </div>
              </div>
            </div>

            {/* Loading Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-8 shadow-level-2 border border-border">
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Loading your dashboard...</div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-level-2 border border-border">
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-secondary">Loading progress data...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  return (
    <>
      {/* Hero Section - Full Width */}
      <InterviewHero />
      
      {/* Interview Modes Section - Full Width */}
      <div className="w-full bg-surface px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <section className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
              Choose Your Interview Mode
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link to={feature.to} key={feature.to}>
                  <Card 
                    className={`hover:shadow-level-3 hover:-translate-y-2 transition-all duration-300 h-full ${
                      feature.featured ? 'border-primary shadow-level-2 scale-105' : ''
                    }`}
                    variant={feature.featured ? 'lavender' : 'default'}
                  >
                    <CardHeader className="pb-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          feature.featured ? 'bg-primary/10' : 'bg-surface-alt'
                        }`}>
                          <span className="text-4xl">{feature.icon}</span>
                        </div>
                        <CardTitle className="text-xl font-bold">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-8">
                      <p className="text-text-secondary leading-relaxed text-center">
                        {feature.body}
                      </p>
                      {feature.featured && (
                        <div className="mt-6 flex justify-center">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                            Most Popular
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Dashboard Overview Section */}
      <div className="w-full bg-surface px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 bg-card rounded-2xl p-6 shadow-level-2 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xl">U</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Ready to practice?</h3>
                <p className="text-text-secondary text-sm">Track your progress and keep improving</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full">
              <HomeIcon size={18} className="text-primary" />
              <span className="text-primary font-semibold text-sm">Weekly Progress</span>
              <div className="w-20 bg-surface-alt rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${dashboardData.stats.weeklyProgress}%` }}
                />
              </div>
              <span className="text-primary font-bold text-sm">{dashboardData.stats.weeklyProgress}%</span>
            </div>
          </div>

          {/* Stats and Progress Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Stats Card */}
            <div className="bg-card rounded-2xl p-8 shadow-level-2 border border-border">
              <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Archive size={18} className="text-primary" />
                </div>
                Your Achievement Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mic size={24} className="text-primary" />
                    <span className="text-4xl font-bold text-text-primary">{dashboardData.stats.totalSessions}</span>
                  </div>
                  <p className="text-text-secondary font-medium">Total Sessions</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageSquare size={24} className="text-primary" />
                    <span className="text-4xl font-bold text-text-primary">{dashboardData.stats.averageScore}</span>
                  </div>
                  <p className="text-text-secondary font-medium">Average Score</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-divider">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive size={20} className="text-primary" />
                    <span className="text-text-primary font-semibold">Questions Completed</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{dashboardData.stats.totalQuestions}</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-card rounded-2xl p-8 shadow-level-2 border border-border">
              <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle size={18} className="text-primary" />
                </div>
                Weekly Progress Tracker
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-text-primary font-semibold">Overall Weekly Progress</span>
                    <span className="text-primary font-bold text-lg">{dashboardData.stats.weeklyProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardData.stats.weeklyProgress}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-text-primary font-semibold">Questions This Week</span>
                    <span className="text-primary font-bold text-lg">{Math.min(100, (dashboardData.stats.questionsThisWeek / 10) * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (dashboardData.stats.questionsThisWeek / 10) * 100)}%` }}
                    />
                  </div>
                  <p className="text-text-secondary text-sm mt-2">{dashboardData.stats.questionsThisWeek} questions completed</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  )
}