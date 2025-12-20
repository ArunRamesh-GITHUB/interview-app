import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { poundsFromCents } from '../lib/money'
import { RefreshCw, Plus, Eye, Ban, Check, Pause } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_KEY || ''

// Only these emails can access the admin panel
const ADMIN_EMAILS = ['ramesharun410@gmail.com']

interface Affiliate {
    slug: string
    display_name: string
    status: string
    commission_rate_bps: number
    paypal_email?: string
    user_id?: string
    created_at: string
}

interface AffiliateStats {
    attributed_users: number
    purchases_count: number
    pending_cents: number
    paid_cents: number
}

interface Commission {
    id: number
    purchase_id: string
    affiliate_slug: string
    user_id?: string
    platform: string
    gross_amount_cents: number
    commission_amount_cents: number
    status: string
    created_at: string
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
        active: 'default',
        pending: 'outline',
        paused: 'secondary',
        banned: 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
}

export default function AffiliatesAdmin() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([])
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
    const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newSlug, setNewSlug] = useState('')
    const [newDisplayName, setNewDisplayName] = useState('')
    const [newPaypalEmail, setNewPaypalEmail] = useState('')
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [authChecking, setAuthChecking] = useState(true)

    useEffect(() => {
        checkAdminAccess()
    }, [])

    async function checkAdminAccess() {
        try {
            const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' })
            const data = await res.json()
            const email = data?.user?.email?.toLowerCase()
            setUserEmail(email)
            if (email && ADMIN_EMAILS.includes(email)) {
                fetchAffiliates()
                fetchCommissions()
            }
        } catch (e) {
            console.error('Auth check failed:', e)
        } finally {
            setAuthChecking(false)
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY,
    }

    async function fetchAffiliates() {
        try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/api/affiliate/admin/list`, { headers })
            if (!res.ok) throw new Error('Failed to fetch affiliates')
            const data = await res.json()
            setAffiliates(data.affiliates || [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function fetchCommissions() {
        try {
            const res = await fetch(`${API_BASE}/api/affiliate/admin/commissions?status=pending`, { headers })
            if (!res.ok) throw new Error('Failed to fetch commissions')
            const data = await res.json()
            setCommissions(data.commissions || [])
        } catch (e: any) {
            console.error('Commissions fetch error:', e)
        }
    }

    async function fetchAffiliateStats(slug: string) {
        try {
            const res = await fetch(`${API_BASE}/api/affiliate/admin/${slug}/stats`, { headers })
            if (!res.ok) throw new Error('Failed to fetch stats')
            const data = await res.json()
            setAffiliateStats(data)
        } catch (e: any) {
            console.error('Stats fetch error:', e)
        }
    }

    async function handleStatusChange(slug: string, newStatus: string) {
        try {
            await fetch(`${API_BASE}/api/affiliate/admin/${slug}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: newStatus }),
            })
            fetchAffiliates()
        } catch (e: any) {
            alert('Failed to update status: ' + e.message)
        }
    }

    async function handleCreateAffiliate() {
        if (!newSlug || !newDisplayName) {
            alert('Slug and display name are required')
            return
        }
        try {
            await fetch(`${API_BASE}/api/affiliate/admin/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    slug: newSlug.toLowerCase().replace(/\s+/g, '_'),
                    display_name: newDisplayName,
                    paypal_email: newPaypalEmail || null,
                }),
            })
            setShowCreateModal(false)
            setNewSlug('')
            setNewDisplayName('')
            setNewPaypalEmail('')
            fetchAffiliates()
        } catch (e: any) {
            alert('Failed to create affiliate: ' + e.message)
        }
    }

    async function handlePayCommission(id: number) {
        try {
            await fetch(`${API_BASE}/api/affiliate/admin/commissions/${id}/pay`, {
                method: 'POST',
                headers,
            })
            fetchCommissions()
        } catch (e: any) {
            alert('Failed to mark as paid: ' + e.message)
        }
    }

    if (authChecking) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin" size={32} />
            </div>
        )
    }

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-error mb-4">Access Denied</p>
                    <p className="text-sm text-text-secondary">
                        You don't have permission to access this page.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin" size={32} />
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-error mb-4">{error}</p>
                    <p className="text-sm text-text-secondary mb-4">
                        Make sure VITE_INTERNAL_KEY is set and matches INTERNAL_SERVER_KEY on the server.
                    </p>
                    <Button onClick={fetchAffiliates}>Retry</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-display">Affiliate Admin</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { fetchAffiliates(); fetchCommissions(); }}>
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} className="mr-2" /> New Affiliate
                    </Button>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle>Create New Affiliate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Slug (e.g., johndoe)"
                            value={newSlug}
                            onChange={(e) => setNewSlug(e.target.value)}
                        />
                        <Input
                            placeholder="Display Name"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                        />
                        <Input
                            type="email"
                            placeholder="PayPal Email (optional)"
                            value={newPaypalEmail}
                            onChange={(e) => setNewPaypalEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleCreateAffiliate}>Create</Button>
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Affiliates Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Affiliates ({affiliates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-2">Slug</th>
                                    <th className="pb-2">Name</th>
                                    <th className="pb-2">PayPal</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Rate</th>
                                    <th className="pb-2">Created</th>
                                    <th className="pb-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {affiliates.map((aff) => (
                                    <tr key={aff.slug} className="border-b">
                                        <td className="py-2 font-mono">{aff.slug}</td>
                                        <td className="py-2">{aff.display_name}</td>
                                        <td className="py-2 text-xs">{aff.paypal_email || '-'}</td>
                                        <td className="py-2"><StatusBadge status={aff.status} /></td>
                                        <td className="py-2">{aff.commission_rate_bps / 100}%</td>
                                        <td className="py-2">{new Date(aff.created_at).toLocaleDateString()}</td>
                                        <td className="py-2">
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedAffiliate(aff)
                                                        fetchAffiliateStats(aff.slug)
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                                {aff.status !== 'active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStatusChange(aff.slug, 'active')}
                                                        title="Activate"
                                                    >
                                                        <Check size={14} className="text-success" />
                                                    </Button>
                                                )}
                                                {aff.status === 'active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStatusChange(aff.slug, 'paused')}
                                                        title="Pause"
                                                    >
                                                        <Pause size={14} className="text-warning" />
                                                    </Button>
                                                )}
                                                {aff.status !== 'banned' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStatusChange(aff.slug, 'banned')}
                                                        title="Ban"
                                                    >
                                                        <Ban size={14} className="text-error" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Affiliate Stats */}
            {selectedAffiliate && affiliateStats && (
                <Card>
                    <CardHeader>
                        <CardTitle>Stats for: {selectedAffiliate.display_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-surface-alt rounded-lg">
                                <div className="text-2xl font-bold text-primary">{affiliateStats.attributed_users}</div>
                                <div className="text-sm text-text-secondary">Attributed Users</div>
                            </div>
                            <div className="text-center p-4 bg-surface-alt rounded-lg">
                                <div className="text-2xl font-bold text-primary">{affiliateStats.purchases_count}</div>
                                <div className="text-sm text-text-secondary">Purchases</div>
                            </div>
                            <div className="text-center p-4 bg-surface-alt rounded-lg">
                                <div className="text-2xl font-bold text-warning">{poundsFromCents(affiliateStats.pending_cents)}</div>
                                <div className="text-sm text-text-secondary">Pending</div>
                            </div>
                            <div className="text-center p-4 bg-surface-alt rounded-lg">
                                <div className="text-2xl font-bold text-success">{poundsFromCents(affiliateStats.paid_cents)}</div>
                                <div className="text-sm text-text-secondary">Paid</div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setSelectedAffiliate(null)}
                        >
                            Close
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Pending Commissions */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Commissions ({commissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {commissions.length === 0 ? (
                        <p className="text-text-secondary text-center py-4">No pending commissions</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2">ID</th>
                                        <th className="pb-2">Affiliate</th>
                                        <th className="pb-2">Platform</th>
                                        <th className="pb-2">Gross</th>
                                        <th className="pb-2">Commission</th>
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissions.map((c) => (
                                        <tr key={c.id} className="border-b">
                                            <td className="py-2">{c.id}</td>
                                            <td className="py-2 font-mono">{c.affiliate_slug}</td>
                                            <td className="py-2">{c.platform}</td>
                                            <td className="py-2">{poundsFromCents(c.gross_amount_cents)}</td>
                                            <td className="py-2 font-semibold">{poundsFromCents(c.commission_amount_cents)}</td>
                                            <td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                                            <td className="py-2">
                                                <Button size="sm" onClick={() => handlePayCommission(c.id)}>
                                                    Mark Paid
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
