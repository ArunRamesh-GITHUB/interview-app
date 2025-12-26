import React from 'react'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { StatPill } from '../components/ui/stat-pill'
import { User, Shield, Download, Trash2, Settings, CreditCard, BookOpen, AlertTriangle } from 'lucide-react'

export default function AccountDashboard() {
  const { user, logout } = useAuth()
  const [accountData, setAccountData] = React.useState<any>(null)
  const [preferences, setPreferences] = React.useState({
    voice: 'alloy',
    timeLimit: 120,
    strictness: 'medium'
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState('')

  React.useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAccountData(data))
      .catch(console.error)
  }, [])

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/account/export', { credentials: 'include' })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my-interview-data.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      // Logout and redirect after successful deletion
      await logout()
      window.location.href = '/account'
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-card border-red-500/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-bold">Delete Account?</h3>
              </div>
              <p className="text-text-secondary">
                This action is <strong>permanent and cannot be undone</strong>. All your data, including:
              </p>
              <ul className="list-disc ml-5 text-sm text-text-secondary space-y-1">
                <li>Interview responses and scores</li>
                <li>Token balance</li>
                <li>Account settings</li>
              </ul>
              <p className="text-red-400 text-sm font-medium">
                Will be permanently deleted.
              </p>
              {deleteError && (
                <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{deleteError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-alt border border-border flex items-center justify-center text-lg sm:text-2xl font-bold tracking-normal text-text-primary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold tracking-normal truncate">{user?.email}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-red-500 border-red-500/30 hover:bg-red-500/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete account</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plan & Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary">Free Plan</Badge>
              <p className="text-sm text-text-secondary mt-1">Basic interview practice</p>
            </div>
            <Button variant="outline" size="sm">
              Manage billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage & Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatPill
              label="Total Sessions"
              value={accountData?.usage?.totalSessions || '0'}
              variant="primary"
            />
            <StatPill
              label="Questions Answered"
              value={accountData?.usage?.totalQuestions || '0'}
              variant="secondary"
            />
            <StatPill
              label="This Week"
              value={accountData?.usage?.questionsThisWeek || '0'}
              variant="accent"
            />
            <StatPill
              label="Average Score"
              value={`${accountData?.usage?.averageScore || '0'}%`}
              variant="success"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interview Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <select
              value={preferences.voice}
              onChange={(e) => setPreferences({ ...preferences, voice: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 bg-card"
            >
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time Limit (seconds)</label>
            <input
              type="range"
              min="60"
              max="300"
              value={preferences.timeLimit}
              onChange={(e) => setPreferences({ ...preferences, timeLimit: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-sm text-text-secondary">{preferences.timeLimit} seconds</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Scoring Strictness</label>
            <select
              value={preferences.strictness}
              onChange={(e) => setPreferences({ ...preferences, strictness: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 bg-card"
            >
              <option value="lenient">Lenient</option>
              <option value="medium">Medium</option>
              <option value="strict">Strict</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Change password
          </Button>
          <Button variant="outline" onClick={logout} className="w-full justify-start">
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export my data
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full justify-start text-red-500 border-red-500/30 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      {/* Resources Section */}
      <Card id="resources">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ul className="list-disc ml-6">
              <li>Use STAR (Situation, Task, Action, Result) to structure competency answers.</li>
              <li>Keep answers 1.5–2.5 minutes. Signpost your structure.</li>
              <li>Practise out loud, record, and review strengths + improvements.</li>
            </ul>
            <p className="text-sm text-text-secondary">Coaching booking: add Calendly/Stripe later.</p>
          </div>
        </CardContent>
      </Card>

      {/* Anchor for Resources */}
      <div className="text-center">
        <a href="#resources" className="text-sm text-primary hover:underline">
          Resources ↓
        </a>
      </div>
    </div>
  )
}