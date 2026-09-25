import { useState } from 'react'
import { Users, UserCheck, UserX, ShieldAlert, CheckCircle, ShieldCheck, Phone, Mail, Clock, Key, Lock, Check } from 'lucide-react'
import { useVendedores } from '../../hooks/useVendedores'
import { formatDateShort } from '../../utils/formatters'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'

export default function AdminVendedoresPage() {
  const {
    vendedores,
    loading,
    aprobarVendedor,
    suspenderVendedor,
    reactivarVendedor,
    rechazarVendedor,
    hacerAdmin,
    cambiarPasswordVendedor,
  } = useVendedores()

  const [processingId, setProcessingId] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  const handleAction = async (actionFn, id) => {
    setProcessingId(id)
    try {
      await actionFn(id)
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      alert('Por favor ingresa una nueva contraseña.')
      return
    }
    setProcessingId(resetUser.id)
    try {
      await cambiarPasswordVendedor(resetUser.id, resetUser.email, newPassword)
      setSuccessNotice(`¡Contraseña actualizada exitosamente para ${resetUser.nombre_completo || resetUser.email}!`)
      setTimeout(() => {
        setSuccessNotice('')
        setResetUser(null)
        setNewPassword('')
      }, 2000)
    } catch (err) {
      alert('Error al cambiar contraseña: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const pendientes = vendedores.filter((v) => v.estado === 'pendiente')
  const activos = vendedores.filter((v) => v.estado === 'activo')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="text-rose-500" />
            Gestión de Vendedores
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Aprueba o rechaza solicitudes pendientes, restablece contraseñas y administra el estado de las cuentas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendientes.length > 0 && (
            <Badge variant="warning" className="text-xs py-1 px-2.5 animate-pulse">
              ⚡ {pendientes.length} Pendiente(s)
            </Badge>
          )}
          <Badge variant="success" className="text-xs py-1 px-2.5">
            {activos.length} Activo(s)
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : vendedores.length === 0 ? (
        <Card className="py-12 text-center text-gray-500 text-xs">
          No hay registros de vendedores en la plataforma.
        </Card>
      ) : (
        <div className="space-y-4">
          {vendedores.map((vendedor) => {
            const isPending = vendedor.estado === 'pendiente'
            const isActive = vendedor.estado === 'activo'
            const isSuspended = vendedor.estado === 'suspendido'
            const isAdmin = vendedor.rol === 'admin'

            return (
              <Card
                key={vendedor.id}
                className={`
                  p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200
                  ${isPending ? 'border-2 border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-900/20' : ''}
                `}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-100">
                      {vendedor.nombre_completo || vendedor.email}
                    </h3>

                    {isPending && (
                      <Badge variant="warning" className="text-[10px]">
                        ⏳ Solicitud Pendiente
                      </Badge>
                    )}
                    {isActive && (
                      <Badge variant="success" className="text-[10px]">
                        ✓ Activo
                      </Badge>
                    )}
                    {isSuspended && (
                      <Badge variant="danger" className="text-[10px]">
                        🚫 Suspendido
                      </Badge>
                    )}
                    {isAdmin && (
                      <Badge variant="info" className="text-[10px]">
                        🛡️ Admin Principal
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-gray-500" /> {vendedor.email}
                    </span>
                    {vendedor.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-emerald-400" /> {vendedor.telefono}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock size={11} /> Registrado: {formatDateShort(vendedor.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                  {/* Botón común para restablecer contraseña */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResetUser(vendedor)
                      setNewPassword('')
                      setSuccessNotice('')
                    }}
                    className="flex items-center gap-1 text-xs text-amber-300 border-amber-900/60 hover:bg-amber-950/30"
                  >
                    <Key size={13} /> Cambiar Clave
                  </Button>

                  {!isAdmin && (
                    <>
                      {/* Botones para vendedores PENDIENTES */}
                      {isPending && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            loading={processingId === vendedor.id}
                            onClick={() => handleAction(aprobarVendedor, vendedor.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <UserCheck size={14} /> Aprobar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={processingId === vendedor.id}
                            onClick={() => handleAction(rechazarVendedor, vendedor.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <UserX size={14} /> Rechazar
                          </Button>
                        </>
                      )}

                      {/* Botones para vendedores ACTIVOS */}
                      {isActive && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={processingId === vendedor.id}
                            onClick={() => handleAction(hacerAdmin, vendedor.id)}
                            className="flex items-center gap-1 text-xs text-rose-400 border-rose-900/60 hover:bg-rose-950/40"
                          >
                            <ShieldCheck size={14} /> Hacer Admin
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={processingId === vendedor.id}
                            onClick={() => handleAction(suspenderVendedor, vendedor.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <ShieldAlert size={14} /> Suspender
                          </Button>
                        </>
                      )}

                      {/* Botones para vendedores SUSPENDIDOS */}
                      {isSuspended && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={processingId === vendedor.id}
                          onClick={() => handleAction(reactivarVendedor, vendedor.id)}
                          className="flex items-center gap-1 text-xs text-emerald-400 border-emerald-900"
                        >
                          <CheckCircle size={14} /> Reactivar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal para restablecer contraseña */}
      {resetUser && (
        <Modal
          isOpen={Boolean(resetUser)}
          onClose={() => setResetUser(null)}
          title={`Restablecer Contraseña: ${resetUser.nombre_completo || resetUser.email}`}
        >
          {successNotice ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-900/50 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-700">
                <Check size={28} />
              </div>
              <p className="text-sm font-semibold text-emerald-300">{successNotice}</p>
            </div>
          ) : (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Asigna una nueva contraseña de acceso para <strong className="text-gray-200">{resetUser.email}</strong>. El vendedor podrá ingresar inmediatamente con esta contraseña.
              </p>

              <Input
                label="Nueva Contraseña"
                type="password"
                icon={Lock}
                placeholder="Ejemplo: Speed2026*"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword(`Speed${Math.floor(1000 + Math.random() * 9000)}*`)}
                  className="text-xs text-gray-400 border-gray-700"
                >
                  ⚡ Generar contraseña rápida
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResetUser(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={processingId === resetUser.id}
                  >
                    Guardar Contraseña
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
