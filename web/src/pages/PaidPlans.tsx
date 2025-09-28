import React, { useEffect, useState } from 'react'
import { Purchases } from '@revenuecat/purchases-js'
import { isMobileApp, requestNativePurchase } from '../utils/mobilebridge.js'

const tokenExplainer = [
  "1 token = 1 minute of Practice (non-Realtime voice).",
  "Realtime uses 9 tokens per minute.",
  "Practice rounds to 15s (0.25 token). Realtime rounds to 10s (1.5 tokens).",
  "Each Realtime session has a 5-token minimum.",
  "Typed answers: 1 token per scored answer.",
]

export default function PaidPlans() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        // Initialize RevenueCat Web
        Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_WEB_API_KEY })
        
        // Set App User ID to Supabase user id if available
        const uid = (window as any).__SUPA_USER_ID__ || null
        if (uid) await Purchases.logIn(uid)

        // Fetch offerings from RevenueCat
        const offs = await Purchases.getOfferings()
        const current = offs.current
        const packs = (current?.availablePackages || [])
          .filter((p: any) => p.packageType === 'CUSTOM') // or filter by identifier e.g., 'starter','plus',...
        setProducts(packs)
      } catch (e) {
        console.warn('RevenueCat initialization failed:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function buy(p: any) {
    // If in mobile app, use native purchase flow
    if (isMobileApp()) {
      const success = requestNativePurchase(p.identifier)
      if (success) {
        console.log('Requested native purchase for:', p.identifier)
        return
      }
    }

    // Fallback to web purchase flow
    try {
      setBusy(p.identifier)
      const res = await Purchases.purchasePackage(p)
      alert('Success! Tokens will be added in a few seconds.')
    } catch (e) {
      console.warn(e)
      alert('Purchase failed or cancelled.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className="p-8">Loading token packs…</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Buy tokens</h1>
      <p className="text-gray-600 mb-8">
        Purchase token packs to use with Practice and Realtime features.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.length === 0 && !loading && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No token packs available. Please check your RevenueCat configuration.
          </div>
        )}
        {products.map((p:any) => (
          <div key={p.identifier} className="rounded-2xl border p-6 shadow-sm flex flex-col">
            <div className="text-xl font-semibold capitalize">{p.storeProduct?.title || p.identifier}</div>
            <div className="text-3xl font-bold mt-2">{p.storeProduct?.priceString || '—'}</div>
            <div className="mt-2 text-sm text-gray-600">{p.storeProduct?.description || 'Token pack'}</div>
            <button
              className="mt-auto w-full rounded-xl bg-black text-white py-2.5 hover:opacity-90 disabled:opacity-60"
              onClick={() => buy(p)}
              disabled={busy === p.identifier}
            >
              {busy === p.identifier ? 'Processing…' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-3">How tokens work</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {tokenExplainer.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <div className="mt-4 text-sm text-gray-500">
          Web purchases are processed by Stripe via RevenueCat. Tokens arrive instantly.
        </div>
      </div>
    </div>
  )
}