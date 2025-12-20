import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    ActivityIndicator,
} from 'react-native'

interface PartnerBalanceCardProps {
    apiBase: string
}

interface PartnerStats {
    signups: number
    pending_cents: number
    paid_cents: number
}

/**
 * Partner Balance Card - Apple-safe rewards display
 * Uses terminology like "Referral Rewards" and "Partner Balance"
 * instead of "commissions" or "money" to avoid App Store issues
 */
export default function PartnerBalanceCard({ apiBase }: PartnerBalanceCardProps) {
    const [loading, setLoading] = useState(true)
    const [isPartner, setIsPartner] = useState(false)
    const [stats, setStats] = useState<PartnerStats | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPartnerStatus()
    }, [])

    const fetchPartnerStatus = async () => {
        try {
            setLoading(true)
            setError(null)

            // Check if user is an affiliate/partner
            const affiliateRes = await fetch(`${apiBase}/api/affiliate/me`, {
                credentials: 'include',
            })

            if (affiliateRes.status === 404) {
                // Not a partner
                setIsPartner(false)
                return
            }

            if (!affiliateRes.ok) {
                throw new Error('Failed to load partner status')
            }

            const affiliateData = await affiliateRes.json()

            if (affiliateData.status !== 'active') {
                setIsPartner(false)
                return
            }

            setIsPartner(true)

            // Fetch stats
            const statsRes = await fetch(`${apiBase}/api/affiliate/me/stats`, {
                credentials: 'include',
            })

            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData)
            }
        } catch (e: any) {
            console.error('Partner status error:', e)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePayoutRequest = () => {
        // Open email for payout request (keeps Apple happy)
        Linking.openURL('mailto:affiliates@nailit.co.uk?subject=Payout%20Request')
    }

    // Format cents to display value (without currency symbol for Apple safety)
    const formatRewards = (cents: number): string => {
        const value = (cents / 100).toFixed(2)
        return value
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#6366F1" />
            </View>
        )
    }

    if (!isPartner || error) {
        // Don't show anything if not a partner
        return null
    }

    const pendingRewards = stats?.pending_cents || 0
    const paidRewards = stats?.paid_cents || 0
    const totalReferrals = stats?.signups || 0

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Referral Rewards</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalReferrals}</Text>
                    <Text style={styles.statLabel}>Referrals</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatRewards(pendingRewards)}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatRewards(paidRewards)}</Text>
                    <Text style={styles.statLabel}>Earned</Text>
                </View>
            </View>

            {pendingRewards >= 2000 && ( // Show payout button if at least 20.00 pending
                <TouchableOpacity style={styles.payoutButton} onPress={handlePayoutRequest}>
                    <Text style={styles.payoutButtonText}>Request Payout</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.disclaimer}>
                Rewards are paid monthly via email request
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6366F1',
    },
    statLabel: {
        fontSize: 12,
        color: '#71727A',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E5E5',
    },
    payoutButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    payoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
})
