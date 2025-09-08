import React from 'react'

export function Spinner({size=24}:{size?:number}){
  const s = { width: size, height: size, borderTopColor: 'transparent' } as React.CSSProperties
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-text-secondary"
      style={s}
      aria-label="Loading"
    />
  )
}

export function LoadingOverlay({text='Loading...'}:{text?:string}){
  return (
    <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-level-2 border border-divider p-4 flex items-center gap-3">
        <Spinner />
        <span className="text-sm text-text-primary">{text}</span>
      </div>
    </div>
  )
}
