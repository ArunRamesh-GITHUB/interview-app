import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Metric } from '../components/Metric'
import { poundsFromCents } from '../lib/money'
import { analytics } from '../lib/analytics'
import { Copy, Share2, Mail, ChevronDown, ChevronUp } from 'lucide-react'

const USE_MOCKS = false

type AffiliateStatus = 'not_applied' | 'pending' | 'active' | 'banned'

interface AffiliateData {
  status: AffiliateStatus
  code?: string
  rate_bps?: number
}

interface AffiliateStats {
  clicks: number
  signups: number
  pending_cents: number
  paid_cents: number
}

const MOCK_DATA: AffiliateData = {
  status: 'active',
  code: 'ARUN123',
  rate_bps: 2000
}

const MOCK_STATS: AffiliateStats = {
  clicks: 142,
  signups: 23,
  pending_cents: 4567,
  paid_cents: 12340
}

function StatusPill({ status }: { status: AffiliateStatus }) {
  const variants = {
    not_applied: { variant: 'secondary' as const, text: 'Not Applied' },
    pending: { variant: 'outline' as const, text: 'Pending' },
    active: { variant: 'default' as const, text: 'Active' },
    banned: { variant: 'destructive' as const, text: 'Banned' },
  }

  const { variant, text } = variants[status]
  
  return <Badge variant={variant}>{text}</Badge>
}

function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  
  const faqs = [
    {
      question: 'Can I refer myself or use fake accounts?',
      answer: 'No self-referrals or spam accounts are allowed. We monitor for fraudulent activity and will ban accounts that violate these terms.'
    },
    {
      question: 'When do I get paid?',
      answer: 'Commissions are paid monthly via PayPal on the 1st of each month, with a minimum payout threshold of £20.'
    },
    {
      question: 'Do coupons and discounts affect my commission?',
      answer: 'Yes, your commission is calculated on the final amount paid by the customer after any discounts or coupons are applied.'
    }
  ]
  
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules & FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-divider last:border-b-0 pb-2 last:pb-0">
            <button
              onClick={() => toggleItem(index)}
              className="flex items-center justify-between w-full text-left py-2 text-text-primary hover:text-primary transition-colors"
            >
              <span className="font-medium">{faq.question}</span>
              {openItems.has(index) ? (
                <ChevronUp size={16} className="flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="flex-shrink-0" />
              )}
            </button>
            {openItems.has(index) && (
              <div className="pb-2 text-text-secondary text-sm">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function Affiliates() {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [payoutEmail, setPayoutEmail] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    fetchAffiliateData()
  }, [])

  async function fetchAffiliateData() {
    try {
      setLoading(true)
      setError(null)
      
      if (USE_MOCKS) {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAffiliateData(MOCK_DATA)
        setStats(MOCK_STATS)
      } else {
        const API_BASE = import.meta.env.VITE_API_URL || ''
        
        const [affiliateRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/affiliate/me`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/affiliate/me/stats`, { credentials: 'include' })
        ])
        
        if (!affiliateRes.ok) {
          if (affiliateRes.status === 404) {
            setAffiliateData({ status: 'not_applied' })
          } else {
            throw new Error('Failed to load affiliate data')
          }
        } else {
          const data = await affiliateRes.json()
          setAffiliateData(data)
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      }
    } catch (err) {
      console.error('Error fetching affiliate data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load affiliate data')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!payoutEmail || !termsAccepted) return
    
    try {
      setApplyLoading(true)
      
      if (USE_MOCKS) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        setAffiliateData({ status: 'pending', code: 'PENDING123' })
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        return
      }
      
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${API_BASE}/api/affiliate/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paypal_email: payoutEmail })
      })
      
      if (!response.ok) {
        throw new Error('Application failed')
      }
      
      const result = await response.json()
      setAffiliateData({ status: result.status, code: result.code })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      analytics.affApplySubmitted()
      fetchAffiliateData() // Refresh data
    } catch (err) {
      console.error('Error applying:', err)
      alert('Application failed. Please try again.')
    } finally {
      setApplyLoading(false)
    }
  }

  function copyLink() {
    if (!affiliateData?.code) return
    const link = `${window.location.origin}/?ref=${affiliateData.code}`
    navigator.clipboard.writeText(link)
    analytics.affLinkCopied()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  async function shareLink() {
    if (!affiliateData?.code || !navigator.share) return
    const link = `${window.location.origin}/?ref=${affiliateData.code}`
    
    try {
      await navigator.share({
        title: 'NailIT - Interview Prep Platform',
        text: 'Get better at interviews with AI-powered practice sessions',
        url: link
      })
    } catch (err) {
      // Fallback to copy
      copyLink()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-surface-alt rounded animate-pulse w-64"></div>
          <div className="h-6 bg-surface-alt rounded animate-pulse w-20"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Metric key={i} label="Loading..." value="" loading />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-error mb-4">Error: {error}</p>
            <Button onClick={fetchAffiliateData}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!affiliateData) return null

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-success text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {affiliateData.status === 'not_applied' ? 'Application submitted!' : 'Link copied!'}
        </div>
      )}
      
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-display">Affiliate Programme</h1>
          <StatusPill status={affiliateData.status} />
        </div>
        <p className="text-subtitle text-text-secondary max-w-2xl mx-auto">
          Earn 20% recurring for every paid subscriber you refer.
        </p>
      </div>

      {/* Apply Card */}
      {affiliateData.status === 'not_applied' && (
        <Card>
          <CardHeader>
            <CardTitle>Apply to Join</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                PayPal Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="rounded border-divider"
              />
              <label htmlFor="terms" className="text-sm text-text-secondary">
                I agree to the affiliate terms and conditions
              </label>
            </div>
            <Button 
              onClick={handleApply}
              disabled={!payoutEmail || !termsAccepted || applyLoading}
              className="w-full"
            >
              {applyLoading ? 'Applying...' : 'Apply'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Your Link */}
      {affiliateData.status !== 'not_applied' && affiliateData.code && (
        <Card>
          <CardHeader>
            <CardTitle>Your Affiliate Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={`${window.location.origin}/?ref=${affiliateData.code}`}
                className="flex-1"
              />
              <Button variant="secondary" onClick={copyLink}>
                <Copy size={16} />
              </Button>
              {navigator.share && (
                <Button variant="secondary" onClick={shareLink}>
                  <Share2 size={16} />
                </Button>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              90-day cookie · First touch wins
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {affiliateData.status !== 'not_applied' && (
        <div>
          <h2 className="text-title mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric 
              label="Clicks" 
              value={stats?.clicks || 0} 
              loading={!stats && !USE_MOCKS} 
            />
            <Metric 
              label="Sign-ups" 
              value={stats?.signups || 0} 
              loading={!stats && !USE_MOCKS} 
            />
            <Metric 
              label="Pending" 
              value={stats ? poundsFromCents(stats.pending_cents) : '£0.00'} 
              loading={!stats && !USE_MOCKS} 
            />
            <Metric 
              label="Paid" 
              value={stats ? poundsFromCents(stats.paid_cents) : '£0.00'} 
              loading={!stats && !USE_MOCKS} 
            />
          </div>
        </div>
      )}

      {/* Payout Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• Paid monthly via PayPal on the 1st</p>
            <p>• Minimum payout £20</p>
            <p>• Refunds reverse commission</p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <FAQ />

      {/* Support */}
      <Card>
        <CardContent className="text-center py-6">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = 'mailto:affiliates@nailit.co.uk'}
            className="inline-flex items-center gap-2"
          >
            <Mail size={16} />
            Contact Affiliate Support
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
