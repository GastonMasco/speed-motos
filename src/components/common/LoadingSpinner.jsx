import { memo } from 'react'

export const LoadingSpinner = memo(({ label = 'Cargando módulo...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-rose-600/30 border-t-rose-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-500">
          ⚡
        </div>
      </div>
      <p className="text-xs font-medium text-gray-400 animate-pulse">{label}</p>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'
