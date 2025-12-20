import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'

type Step = 'signup' | 'success'

export default function ReferralLanding() {
    const { slug } = useParams<{ slug: string }>()
    const [step, setStep] = useState<Step>('signup')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !password) {
            setError('Please enter email and password')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    affiliate_slug: slug // Pass the affiliate slug
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            // Success - show app download step
            setStep('success')
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    // App Store URLs - update these with your actual URLs
    const APP_STORE_URL = 'https://apps.apple.com/app/nailit-interview-prep/id6738030857'
    const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nailit.interview'

    return (
        <div className="min-h-dvh bg-surface relative flex items-center justify-center px-4 py-8">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent via-purple-500/4 via-transparent to-blue-500/6 pointer-events-none" />

            <Card className="w-full max-w-md bg-black/40 backdrop-blur-md border-white/10 relative z-10">
                <CardContent className="p-8 space-y-6">
                    {step === 'signup' ? (
                        <>
                            {/* Header */}
                            <div className="text-center space-y-3">
                                <div className="text-4xl">🎯</div>
                                <h1 className="text-2xl font-bold text-white">
                                    Join NailIT Interview Prep
                                </h1>
                                {slug && (
                                    <p className="text-white/60 text-sm">
                                        Referred by: <span className="text-orange-400 font-medium">{slug}</span>
                                    </p>
                                )}
                                <p className="text-white/70">
                                    Create your account to start practicing with AI-powered interview coaching.
                                </p>
                            </div>

                            {/* Signup Form */}
                            <form onSubmit={handleSignup} className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Create password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-white/20 px-4 py-4 bg-white/10 text-white placeholder-white/50 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    required
                                    minLength={6}
                                />

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-sm text-red-300 text-center">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
                                >
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>

                            {/* Terms */}
                            <p className="text-white/40 text-xs text-center">
                                By signing up, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="text-center space-y-4">
                                <div className="text-6xl">🎉</div>
                                <h1 className="text-2xl font-bold text-white">
                                    Account Created!
                                </h1>
                                <p className="text-white/70">
                                    Download the app and log in with the same email to start your interview practice.
                                </p>

                                {/* App Store Buttons */}
                                <div className="space-y-3 pt-4">
                                    <a
                                        href={APP_STORE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full bg-white/10 text-white font-semibold py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                        </svg>
                                        Download on App Store
                                    </a>

                                    <a
                                        href={PLAY_STORE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full bg-white/10 text-white font-semibold py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                        </svg>
                                        Get on Google Play
                                    </a>
                                </div>

                                {/* Important Message */}
                                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                    <p className="text-orange-300 font-medium">
                                        ⚡ Log in with: <span className="text-white">{email}</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
