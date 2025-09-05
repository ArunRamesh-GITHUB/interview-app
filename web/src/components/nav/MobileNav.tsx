// web/src/components/nav/MobileNav.tsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Logo } from '../ui/logo'

type NavLink = {
  label: string
  to: string
  icon?: React.ComponentType<{ size?: number }>
}

interface MobileNavProps {
  links: NavLink[]
}

export function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
    window.location.href = '/account'
  }

  return (
    <>
      {/* Hamburger trigger - visible on mobile and tablet */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="lg:hidden p-2 rounded-lg hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-sm bg-card border-r border-divider z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-end px-4 py-4 border-b border-divider pt-[env(safe-area-inset-top,1rem)]">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-lg hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation links */}
        <nav role="navigation" className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {user && links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 h-12 rounded-lg hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset text-text-primary"
                >
                  {link.icon && <link.icon size={20} />}
                  <span className="font-medium">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="border-t border-divider p-4 pb-[env(safe-area-inset-bottom,1rem)]">
          {user ? (
            <>
              <div className="mb-3 px-2 text-sm text-text-secondary">
                Signed in as <strong>{user.email}</strong>
              </div>
              <div className="space-y-2">
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 h-12 rounded-lg hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset text-text-primary"
                >
                  <span>Account</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 h-12 rounded-lg hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset text-text-primary text-left"
                >
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-3 h-12 rounded-lg bg-primary text-primary-on text-center font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Sign in
              </Link>
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-3 h-12 rounded-lg border border-divider text-center font-medium hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}