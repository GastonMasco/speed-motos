import { memo } from 'react'

export const Card = memo(({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-gray-800/60 border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-gray-700 transition-colors duration-200 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
