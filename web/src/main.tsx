// web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './styles/theme.css'
import './styles/animations.css'
import './styles.css'

import { AuthProvider } from './lib/auth'
import { TokenProvider } from './tokens/TokenProvider'
import { ThemeProvider } from './components/ui/ThemeProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppShell from './shell/App'
import Home from './pages/Home'
import LiveInterview from './pages/LiveInterview'
import RealtimeInterview from './pages/RealtimeInterview'
import Drill from './pages/Drill'
import CVUpload from './pages/CVUpload'
import MyAnswers from './pages/MyAnswers'
import Resources from './pages/Resources'
import Settings from './pages/Settings'
import Account from './pages/Account'
import PaidPlans from './pages/PaidPlans'
import Affiliates from './pages/Affiliates'
import AffiliatesAdmin from './pages/AffiliatesAdmin'
import Tutoring from './pages/Tutoring'
import ReferralLanding from './pages/ReferralLanding'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ProtectedRoute><Home /></ProtectedRoute>
      },
      {
        path: 'live',
        element: <ProtectedRoute><LiveInterview /></ProtectedRoute>
      },
      {
        path: 'realtime',
        element: <ProtectedRoute><RealtimeInterview /></ProtectedRoute>
      },
      {
        path: 'drill',
        element: <ProtectedRoute><Drill /></ProtectedRoute>
      },
      {
        path: 'cv',
        element: <ProtectedRoute><CVUpload /></ProtectedRoute>
      },
      {
        path: 'answers',
        element: <ProtectedRoute><MyAnswers /></ProtectedRoute>
      },
      {
        path: 'resources',
        element: <Navigate to="/account#resources" replace />
      },
      {
        path: 'settings',
        element: <ProtectedRoute><Settings /></ProtectedRoute>
      },
      {
        path: 'plans',
        element: <ProtectedRoute><PaidPlans /></ProtectedRoute>
      },
      {
        path: 'affiliates',
        element: <ProtectedRoute><Affiliates /></ProtectedRoute>
      },
      {
        path: 'affiliates/admin',
        element: <ProtectedRoute><AffiliatesAdmin /></ProtectedRoute>
      },
      {
        path: 'tutoring',
        element: <ProtectedRoute><Tutoring /></ProtectedRoute>
      },
      {
        path: 'community',
        element: <Navigate to="/tutoring" replace />
      },
      // Account page is NOT protected - users need access to login
      { path: 'account', element: <Account /> },
      // Referral landing page - NOT protected, captures affiliate_slug from URL
      { path: 'r/:slug', element: <ReferralLanding /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TokenProvider>
          <RouterProvider router={router} />
        </TokenProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
