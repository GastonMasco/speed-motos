import { useState } from 'react'
import { Users, UserCheck, ShieldAlert, CheckCircle, Clock, Shield } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers'
import { formatDateShort } from '../../utils/formatters'
import { USER_STATUS_LABELS, USER_STATUS, ROLES } from '../../utils/constants'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export default function UsersPage() {
  const { users, loading, updateUserStatus } = useUsers()
  const [updatingId, setUpdatingId] = useState(null)

  const handleStatusChange = async (userId, newStatus) => {
    setUpdatingId(userId)
    try {
      await updateUserStatus(userId, newStatus)
    } catch (err) {
      alert('Error al actualizar estado del usuario: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = users.filter(u => u.status === USER_STATUS.PENDING).length
  const activeCount = users.filter(u => u.status === USER_STATUS.ACTIVE).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="text-rose-500" />
            Gestión de Vendedores y Accesos (Admin)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Aprueba nuevas solicitudes de registro o suspende cuentas de vendedores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-xs py-1 px-3">
            {pendingCount} Pendiente(s)
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-3">
            {activeCount} Activo(s)
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="py-12 text-center text-gray-500 text-xs">
          No hay vendedores registrados en la plataforma.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((u) => {
            const statusConfig = USER_STATUS_LABELS[u.status] || USER_STATUS_LABELS[USER_STATUS.PENDING]
            const isAdmin = u.role === ROLES.ADMIN
            const isPending = u.status === USER_STATUS.PENDING
            const isActive = u.status === USER_STATUS.ACTIVE
            const isSuspended = u.status === USER_STATUS.SUSPENDED

            return (
              <Card key={u.id} className="flex flex-col justify-between p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-100">{u.full_name || 'Sin Nombre'}</h3>
                      {isAdmin && (
                        <Badge variant="danger" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                          <Shield size={10} /> ADMIN
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 block mt-0.5">{u.email}</span>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Registrado el: {formatDateShort(u.created_at)}
                    </span>
                  </div>

                  <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {!isAdmin && (
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                    {isPending && (
                      <Button
                        variant="success"
                        size="sm"
                        loading={updatingId === u.id}
                        onClick={() => handleStatusChange(u.id, USER_STATUS.ACTIVE)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <UserCheck size={14} /> Aprobar Vendedor
                      </Button>
                    )}

                    {isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={updatingId === u.id}
                        onClick={() => handleStatusChange(u.id, USER_STATUS.SUSPENDED)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <ShieldAlert size={14} /> Suspender
                      </Button>
                    )}

                    {isSuspended && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={updatingId === u.id}
                        onClick={() => handleStatusChange(u.id, USER_STATUS.ACTIVE)}
                        className="flex items-center gap-1 text-xs text-emerald-400 border-emerald-900"
                      >
                        <CheckCircle size={14} /> Reactivar Cuenta
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
