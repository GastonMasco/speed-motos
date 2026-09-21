import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export const OfflineBadge = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setShowBackOnline(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowBackOnline(true)
      const timer = setTimeout(() => {
        setShowBackOnline(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showBackOnline) return null

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-300 flex items-center gap-2 border backdrop-blur-md ${
        isOffline
          ? 'bg-rose-950/90 text-rose-200 border-rose-600/60 shadow-rose-950/50 animate-pulse'
          : 'bg-emerald-950/90 text-emerald-200 border-emerald-600/60 shadow-emerald-950/50'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff size={16} className="text-rose-400 shrink-0" />
          <span>Sin conexión a internet — Modo offline activo (datos en caché)</span>
        </>
      ) : (
        <>
          <Wifi size={16} className="text-emerald-400 shrink-0" />
          <span>Conexión restablecida — Sincronizando con Supabase</span>
        </>
      )}
    </div>
  )
}
