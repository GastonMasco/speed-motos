import { useState, useEffect } from 'react'
import { Clock, ShieldAlert, RefreshCw, LogOut, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useNavigate } from 'react-router-dom'

export default function PendingPage() {
  const { profile, refreshProfile, logout, isSuspended, activateAsAdmin } = useAuth()
  const [checking, setChecking] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (profile?.estado === 'activo') {
      if (profile?.rol === 'admin') {
        navigate('/admin/inicio', { replace: true })
      } else {
        navigate('/vendedor/inicio', { replace: true })
      }
    }
  }, [profile, navigate])

  const handleRefresh = async () => {
    setChecking(true)
    try {
      const updatedProfile = await refreshProfile()
      if (updatedProfile?.estado === 'activo') {
        if (updatedProfile?.rol === 'admin') {
          navigate('/admin/inicio')
        } else {
          navigate('/vendedor/inicio')
        }
      }
    } finally {
      setTimeout(() => setChecking(false), 500)
    }
  }

  const handleActivateAdmin = async () => {
    setChecking(true)
    try {
      await activateAsAdmin()
      navigate('/admin/inicio', { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="flex flex-col items-center mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl ${isSuspended ? 'bg-rose-600 shadow-rose-900/50' : 'bg-amber-600 shadow-amber-900/50'}`}>
            {isSuspended ? <ShieldAlert size={36} /> : <Clock size={36} />}
          </div>

          <Badge variant={isSuspended ? 'danger' : 'warning'} className="mb-2">
            {isSuspended ? 'Cuenta Suspendida' : 'Pendiente de Aprobación'}
          </Badge>

          <h2 className="text-lg font-bold text-gray-100">
            {isSuspended ? 'Acceso Restringido' : 'Solicitud Enviada'}
          </h2>

          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            {isSuspended ? (
              <>Tu cuenta de vendedor ha sido suspendida temporalmente por el Administrador. Si crees que se trata de un error, contacta al encargado.</>
            ) : (
              <>Hola <strong className="text-gray-200">{profile?.nombre_completo || profile?.full_name || profile?.email || 'Gaston Masco'}</strong>. Tu cuenta se encuentra registrada y a la espera de ser activada por el Administrador principal de Speed Rao Motos.</>
            )}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            variant="success"
            fullWidth
            loading={checking}
            onClick={handleActivateAdmin}
            className="flex items-center justify-center gap-2 py-3 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 text-xs"
          >
            🛡️ Activar mi cuenta como Administrador Principal
          </Button>

          {!isSuspended && (
            <Button
              variant="secondary"
              fullWidth
              loading={checking}
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 text-xs"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              Comprobar mi estado de aprobación
            </Button>
          )}

          <Button
            variant="outline"
            fullWidth
            onClick={logout}
            className="flex items-center justify-center gap-2 text-rose-400 border-rose-950 hover:bg-rose-950/30 text-xs"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <Wrench size={12} /> Speed Rao Motos - Cochabamba, Bolivia
        </div>
      </div>
    </div>
  )
}
