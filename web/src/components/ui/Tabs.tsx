import React, { useState, createContext, useContext } from 'react'
import { cn } from '../../lib/utils'

interface TabsContextType {
  activeTab: string
  onTabChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, className, onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-surface-alt p-1',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  const { activeTab, onTabChange } = context
  const isActive = activeTab === value

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-card text-text-primary shadow-sm'
          : 'text-text-secondary hover:text-text-primary',
        className
      )}
      onClick={() => onTabChange(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  const { activeTab } = context
  
  if (activeTab !== value) return null

  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  )
}
