// web/src/lib/nav.ts
import { Home, Mic, Bot, Pen, File, Library, User, Users, DollarSign } from 'lucide-react'

export const NAV_LINKS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Payment Plans', to: '/plans', icon: DollarSign },
  { label: 'Live Interview', to: '/live', icon: Mic },
  { label: 'Realtime AI', to: '/realtime', icon: Bot },
  { label: 'Drill', to: '/drill', icon: Pen },
  { label: 'CV Upload', to: '/cv', icon: File },
  { label: 'My Answers', to: '/answers', icon: Library },
  { label: 'Tutoring', to: '/tutoring', icon: Users },
  { label: 'Affiliates', to: '/affiliates', icon: DollarSign },
]

export const AUTH_LINKS = {
  account: { label: 'Account', to: '/account', icon: User },
  settings: { label: 'Settings', to: '/settings' },
}