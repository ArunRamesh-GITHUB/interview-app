// web/src/shell/App.tsx
import React from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { MobileNav } from '../components/nav/MobileNav'
import { Logo } from '../components/ui/logo'
import { TokenBalance } from '../components/ui/TokenBalance'
import { NAV_LINKS } from '../lib/nav'


function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAccountPage = location.pathname === '/account'

  const handleLogout = async () => {
    await logout()
    window.location.href = '/account'
  }

  return (
    <header className="bg-card border-b border-divider w-full pt-safe">
      <div className="mx-auto max-w-screen-xl md:max-w-5xl px-3 sm:px-4 flex items-center justify-between lg:justify-start py-2 sm:py-3 min-w-0 gap-2 sm:gap-4 lg:gap-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[50%] sm:max-w-none lg:flex-initial">
          <MobileNav links={NAV_LINKS} />
          <Logo size="md" className="lg:hidden" />
        </div>
        <nav className="hidden lg:flex items-center justify-between flex-1 mx-4 xl:mx-6">
          {user ? (
            <>
              <div className="flex items-center gap-2 xl:gap-3">
                <NavLink to="/" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Home</NavLink>
                <NavLink to="/live" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Live Interview</NavLink>
                <NavLink to="/realtime" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Realtime AI</NavLink>
                <NavLink to="/drill" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Drill</NavLink>
                <NavLink to="/cv" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>CV Upload</NavLink>
              </div>
              <div className="flex items-center gap-2 xl:gap-3">
                <NavLink to="/answers" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>My Answers</NavLink>
                <NavLink to="/tutoring" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Tutoring</NavLink>
                <NavLink to="/affiliates" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Affiliates</NavLink>
                <NavLink to="/account" className={({isActive}) => `px-3 py-2 xl:px-4 xl:py-2 rounded-lg text-sm xl:text-sm font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-on' : 'hover:bg-surface-alt text-text-primary'}`}>Account</NavLink>
              </div>
            </>
          ) : (
            !isAccountPage && <Logo size="lg" className="hidden lg:block" />
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 lg:ml-auto">
          {user && (
            <>
              <TokenBalance 
                variant="compact" 
                clickable
                onClick={() => window.location.href = '/plans'}
                className="hidden sm:flex mr-1"
              />
              <TokenBalance 
                variant="compact" 
                showLabel={false}
                clickable
                onClick={() => window.location.href = '/plans'}
                className="sm:hidden mr-1"
              />
            </>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-black px-2 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm leading-5 text-white flex items-center whitespace-nowrap"
            >
              Logout
            </button>
          ) : (
            !isAccountPage && (
              <Link
                to="/account"
                className="rounded-2xl border border-divider px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm leading-5 hover:bg-surface-alt text-text-primary flex items-center whitespace-nowrap"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  )
}

export default function AppShell() {
  const location = useLocation()
  const { user } = useAuth()
  
  
  // IMPORTANT: no BrowserRouter here. This is just a layout.
  return (
    <div>
      <Header />
      <div className="mx-auto max-w-screen-xl md:max-w-5xl px-4 pt-4 md:pt-8 pb-4">
        <Outlet />
      </div>
    </div>
  )
}
