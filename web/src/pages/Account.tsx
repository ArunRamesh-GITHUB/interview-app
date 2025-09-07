import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import AccountDashboard from './AccountDashboard'

type Mode = 'signin' | 'register'

export default function Account() {
  const [mode, setMode] = React.useState<Mode>('signin') // default = sign in
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [msg, setMsg] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  
  // Get the return URL from navigation state
  const from = location.state?.from?.pathname || '/'

  async function post(path: string, body: any) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok || data?.error) {
      throw new Error(data?.error || 'Something went wrong')
    }
    return data
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await post('/api/register', { email, password })
      setMsg('Account created. Please sign in.')
      setMode('signin')
    } catch (err: any) {
      setMsg(err.message || 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await login(email, password)
      // Navigate to return URL or home
      navigate(from, { replace: true })
    } catch (err: any) {
      setMsg(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // If user is signed in, show account dashboard instead of auth forms
  if (user && !loading) {
    return <AccountDashboard />
  }

  return (
    <div className="min-h-dvh bg-surface relative flex items-center justify-center px-4">
      {/* Accent overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent via-purple-500/4 via-transparent to-blue-500/6 pointer-events-none"></div>
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-md border-white/10 relative z-10">
        <CardContent className="space-y-6 p-8">
          {/* Toggle */}
          <div className="flex bg-white/10 rounded-full p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                mode === 'signin' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                mode === 'register' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/70">
              {mode === 'signin' ? 'Sign in to continue your interview practice' : 'Start your interview practice journey'}
            </p>
          </div>

          {/* Forms */}
          {mode === 'signin' ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <div className="space-y-4">
                <input
                  className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 backdrop-blur-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 backdrop-blur-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onRegister}>
              <div className="space-y-4">
                <input
                  className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 backdrop-blur-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 backdrop-blur-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                  placeholder="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          {/* Message */}
          {msg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-red-300 text-center">{msg}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
