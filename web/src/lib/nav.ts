// web/src/lib/nav.ts
import { Home, Mic, Bot, Pen, File, Library, User, Users, DollarSign } from 'lucide-react'

// Check if running inside the mobile app WebView (user agent contains "NailIT")
export const isMobileApp = () => {
  if (typeof window === 'undefined') return false
  return window.navigator.userAgent.includes('NailIT')
}

// All navigation links - some are filtered for mobile app
const ALL_NAV_LINKS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Payment Plans', to: '/plans', icon: DollarSign },
  { label: 'Live Interview', to: '/live', icon: Mic },
  { label: 'Realtime AI', to: '/realtime', icon: Bot },
  { label: 'Drill', to: '/drill', icon: Pen },
  { label: 'CV Upload', to: '/cv', icon: File },
  { label: 'My Answers', to: '/answers', icon: Library },
  { label: 'Tutoring', to: '/tutoring', icon: Users },
  { label: 'Affiliates', to: '/affiliates', icon: DollarSign, hideInMobileApp: true },
]

// Export filtered links based on platform
export const getNavLinks = () => {
  const inMobileApp = isMobileApp()
  return ALL_NAV_LINKS.filter(link => !inMobileApp || !link.hideInMobileApp)
}

// For backward compatibility
export const NAV_LINKS = ALL_NAV_LINKS

export const AUTH_LINKS = {
  account: { label: 'Account', to: '/account', icon: User },
  settings: { label: 'Settings', to: '/settings' },
}