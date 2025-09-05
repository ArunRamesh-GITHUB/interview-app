import React from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { LoadingOverlay, Spinner } from '../components/ui/spinner'
import { api } from '../lib/utils'
import { ProgressLayout } from '../layouts'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Home as HomeIcon, Mic, Archive, BookOpen, CreditCard, RefreshCw, Trash2, Calendar, User } from 'lucide-react'

type Attempt = {
  id: string
  mode: 'live'|'drill'|'agent'
  question: string
  answer: string
  scoring: any
  created_at: string
}

export default function MyAnswers(){
  const [items, setItems] = React.useState<Attempt[]>([])
  const [loading, setLoading] = React.useState(true)
  const [msg, setMsg] = React.useState('')
  const [timePeriod, setTimePeriod] = React.useState<'recent' | 'week' | 'month'>('recent')

  const load = async ()=>{
    setLoading(true)
    try{
      const d = await api.listAttempts(200)
      setItems(d.items || [])
    }catch(e:any){
      setMsg(e?.message || 'Failed to load attempts')
    }finally{
      setLoading(false)
    }
  }

  React.useEffect(()=>{ load() }, [])

  const del = async (id: string)=>{
    if (!confirm('Delete this saved attempt?')) return
    try{ await api.deleteAttempt(id); setItems(prev=> prev.filter(x=> x.id !== id)) }catch{}
  }

  const navigationItems = [
    { id: 'home', icon: <HomeIcon size={24} />, href: '/' },
    { id: 'drill', icon: <Mic size={24} />, href: '/drill' },
    { id: 'answers', icon: <Archive size={24} />, label: 'My Answers' },
    { id: 'resources', icon: <BookOpen size={24} />, href: '/resources' },
    { id: 'account', icon: <CreditCard size={24} />, href: '/account' }
  ]

  // Filter items based on selected time period
  const filteredItems = React.useMemo(() => {
    const now = new Date()
    
    switch (timePeriod) {
      case 'week': {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
        weekStart.setHours(0, 0, 0, 0)
        return items.filter(item => new Date(item.created_at) >= weekStart)
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return items.filter(item => new Date(item.created_at) >= monthStart)
      }
      case 'recent':
      default: {
        // Recent: last 30 days
        const recentStart = new Date(now)
        recentStart.setDate(now.getDate() - 30)
        return items.filter(item => new Date(item.created_at) >= recentStart)
      }
    }
  }, [items, timePeriod])

  const avgScore = React.useMemo(() => {
    const scores = filteredItems.filter(item => item.scoring?.score).map(item => item.scoring.score)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [filteredItems])

  return (
    <ProgressLayout
      headerProps={{
        greeting: 'Your answers',
        actions: (
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw size={16} />
          </Button>
        )
      }}
      timeControl={{
        options: [
          { value: 'recent', label: 'Recent' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' }
        ],
        value: timePeriod,
        onChange: (value: string) => setTimePeriod(value as 'recent' | 'week' | 'month')
      }}
      navItems={navigationItems}
      activeNavId="answers"
    >
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-headline font-bold text-primary">{filteredItems.length}</div>
              <div className="text-caption text-text-secondary">Total Attempts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-headline font-bold text-violet-300">{avgScore}</div>
              <div className="text-caption text-text-secondary">Avg Score</div>
            </CardContent>
          </Card>
        </div>

        {/* 30-day deletion notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-caption text-amber-800">
            <strong>📋 Note:</strong> Answers will be automatically removed after 30 days. Screenshot them if you want to keep them permanently.
          </p>
        </div>

        {msg && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-caption text-error">{msg}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-body text-text-secondary">
            <Spinner /> Loading your saved attempts…
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Archive size={48} className="mx-auto mb-4 text-text-tertiary" />
              <p className="text-body text-text-secondary mb-2">
                {items.length === 0 ? 'No saved attempts yet' : `No attempts found for ${timePeriod === 'week' ? 'this week' : timePeriod === 'month' ? 'this month' : 'recent period'}`}
              </p>
              <p className="text-caption text-text-tertiary">
                {items.length === 0 ? 'Practice in Live or Drill modes and they\'ll be saved automatically.' : 'Try selecting a different time period.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-title font-bold text-text-primary px-2">Your Attempts</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredItems.map(a => (
                <Card key={a.id} className="hover:shadow-level-2 transition-all duration-fast">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant={
                        a.mode === 'live' ? 'default' : 
                        a.mode === 'drill' ? 'secondary' : 'outline'
                      }>
                        {a.mode}
                      </Badge>
                      <div className="flex items-center gap-1 text-caption text-text-tertiary">
                        <Calendar size={12} />
                        {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-subtitle leading-tight">
                      {a.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-label font-semibold text-text-secondary mb-1">Your Answer</div>
                      <p className="text-caption text-text-primary whitespace-pre-wrap line-clamp-3">
                        {a.answer}
                      </p>
                    </div>
                    
                    {a.scoring && (
                      <div className="rounded-lg border border-divider bg-surface-alt p-3">
                        <div className="text-subtitle font-bold text-text-primary mb-2">
                          Score: {a.scoring.score}/100 — {a.scoring.band}
                        </div>
                        <p className="text-caption text-text-secondary mb-2">{a.scoring.summary}</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-caption font-semibold text-success mb-1">Strengths</div>
                            <ul className="list-disc list-inside text-caption text-text-secondary space-y-0.5">
                              {Array.isArray(a.scoring.strengths) && a.scoring.strengths.map((s:string, i:number)=> 
                                <li key={i}>{s}</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <div className="text-caption font-semibold text-warning mb-1">Improvements</div>
                            <ul className="list-disc list-inside text-caption text-text-secondary space-y-0.5">
                              {Array.isArray(a.scoring.improvements) && a.scoring.improvements.map((s:string, i:number)=> 
                                <li key={i}>{s}</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" onClick={()=>del(a.id)}>
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProgressLayout>
  )
}
