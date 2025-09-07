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
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-headline text-text-primary">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <p className="text-body text-text-secondary">
            {mode === 'signin' ? 'Sign in to continue your interview practice' : 'Start your interview practice journey'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle */}
          <div className="flex bg-surface-alt rounded-pill p-1">
            <button
              className={`flex-1 rounded-pill px-4 py-2 text-label font-semibold transition-all duration-fast ${
                mode === 'signin' ? 'bg-primary text-primary-on shadow-level-1' : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`flex-1 rounded-pill px-4 py-2 text-label font-semibold transition-all duration-fast ${
                mode === 'register' ? 'bg-primary text-primary-on shadow-level-1' : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Forms */}
          {mode === 'signin' ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <div className="space-y-3">
                <input
                  className="w-full rounded-lg border border-border px-4 py-3 bg-card text-text-primary font-primary focus:border-primary focus:outline-none transition-colors duration-fast"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-lg border border-border px-4 py-3 bg-card text-text-primary font-primary focus:border-primary focus:outline-none transition-colors duration-fast"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button disabled={loading} variant="primary" type="submit" className="w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onRegister}>
              <div className="space-y-3">
                <input
                  className="w-full rounded-lg border border-border px-4 py-3 bg-card text-text-primary font-primary focus:border-primary focus:outline-none transition-colors duration-fast"
                  placeholder="Email address"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-lg border border-border px-4 py-3 bg-card text-text-primary font-primary focus:border-primary focus:outline-none transition-colors duration-fast"
                  placeholder="Password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button disabled={loading} variant="primary" type="submit" className="w-full">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}

          {/* Message */}
          {msg && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-caption text-error text-center">{msg}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
