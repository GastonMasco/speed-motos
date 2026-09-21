import { memo } from 'react'

export const Badge = memo(({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const styles = {
    neutral: 'bg-gray-800 text-gray-300 border-gray-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant] || styles.neutral} ${className}`}>
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'
