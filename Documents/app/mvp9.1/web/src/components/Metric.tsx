import React from 'react'

interface MetricProps {
  label: string
  value: string | number
  loading?: boolean
}

export function Metric({ label, value, loading }: MetricProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg p-4 border border-divider">
        <div className="h-4 bg-surface-alt rounded animate-pulse mb-2"></div>
        <div className="h-6 bg-surface-alt rounded animate-pulse w-20"></div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg p-4 border border-divider">
      <div className="text-text-secondary text-sm font-medium">{label}</div>
      <div className="text-text-primary text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
