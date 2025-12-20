import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native'
import { setManualReferralCode, getPendingAffiliateSlug } from '../lib/affiliate'

interface ReferralCodeScreenProps {
    onComplete: () => void
    onSkip?: () => void
}

/**
 * Manual referral code input screen for onboarding
 * Apple-safe terminology: "Referral Code" or "Creator Code"
 */
export default function ReferralCodeScreen({ onComplete, onSkip }: ReferralCodeScreenProps) {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleApply = async () => {
        if (!code.trim()) {
            setError('Please enter a referral code')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await setManualReferralCode(code.trim())
            onComplete()
        } catch (e: any) {
            setError(e.message || 'Failed to apply code')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => {
        if (onSkip) {
            onSkip()
        } else {
            onComplete()
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Have a Referral Code?</Text>
                    <Text style={styles.subtitle}>
                        If someone shared this app with you, enter their code below.
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter creator code"
                        placeholderTextColor="#8F9098"
                        value={code}
                        onChangeText={(text) => {
                            setCode(text)
                            setError(null)
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleApply}
                    />
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleApply}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Apply Code</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleSkip}
                        disabled={loading}
                    >
                        <Text style={styles.secondaryButtonText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    You can only apply one referral code per account.
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#71727A',
        textAlign: 'center',
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1A1A1A',
        backgroundColor: '#F8F8F8',
    },
    errorText: {
        color: '#E53935',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 12,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#6366F1',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#71727A',
        fontSize: 16,
        fontWeight: '500',
    },
    disclaimer: {
        marginTop: 24,
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
    },
})
