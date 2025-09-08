import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Force dark mode always
  const theme: Theme = 'dark'
  const resolvedTheme: 'light' | 'dark' = 'dark'

  // Ensure dark theme is applied (it should already be set in HTML, but ensure it stays)
  useEffect(() => {
    const root = document.documentElement
    if (!root.classList.contains('dark')) {
      root.classList.add('dark')
    }
  }, [])

  // No-op function for setTheme since we're forcing dark mode
  const updateTheme = (newTheme: Theme) => {
    // Theme switching disabled - always stay in dark mode
    console.warn('Theme switching is disabled. App is locked to dark mode.')
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        resolvedTheme, 
        setTheme: updateTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}