import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading, isPending, isSuspended, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner label="Verificando sesión y permisos..." />
  }

  // 1. Sin sesión de usuario -> redirigir a /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Si el usuario está pendiente de aprobación
  if (isPending && location.pathname !== '/pendiente') {
    return <Navigate to="/pendiente" replace />
  }

  // 3. Si el usuario está suspendido
  if (isSuspended && location.pathname !== '/pendiente') {
    return <Navigate to="/pendiente" replace />
  }

  // 4. Verificación de permisos de ruta por rol
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = profile?.rol || 'vendedor'
    if (!allowedRoles.includes(currentRole)) {
      // Si un vendedor intenta ingresar a /admin/* -> redirigir a su inicio
      if (currentRole === 'vendedor') {
        return <Navigate to="/vendedor/inicio" replace />
      }
      // Si un admin ingresa a una ruta diferente -> redirigir a su inicio admin
      if (currentRole === 'admin') {
        return <Navigate to="/admin/inicio" replace />
      }
      return <Navigate to="/login" replace />
    }
  }

  return children
}
