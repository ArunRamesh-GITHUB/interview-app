import React from 'react'
import branch from 'react-native-branch'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useCaptureAffiliateSlug() {
  // call once in a root component
  React.useEffect(() => {
    const sub = branch.subscribe(({ error, params }) => {
      if (error) return
      const url = params?.['~referring_link'] || ''
      const deeplink = params?.['~canonical_url'] || ''
      const candidate = String(url || deeplink || '')
      const m = candidate.match(/\/r\/([^/?#]+)/)
      if (m?.[1]) AsyncStorage.setItem('pending_aff', m[1])
      const aff = params?.affiliate_slug
      if (aff) AsyncStorage.setItem('pending_aff', String(aff))
    })
    return () => sub && sub()
  }, [])
}

export async function bindAffiliateIfAny(apiBase: string) {
  const aff = await AsyncStorage.getItem('pending_aff')
  if (!aff) return
  await fetch(`${apiBase}/api/affiliate/bind`, { method:'POST', credentials:'include' })
  // optional: await AsyncStorage.removeItem('pending_aff')
}