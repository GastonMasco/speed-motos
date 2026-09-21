import { useState, useEffect } from 'react'
import { Wrench, Plus, Search, Phone, Calendar, DollarSign, CheckCircle2, Clock } from 'lucide-react'
import { useRepairs } from '../../hooks/useRepairs'
import { formatBs, formatDate } from '../../utils/formatters'
import { REPAIR_STATUS_LABELS } from '../../utils/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Pagination } from '../../components/common/Pagination'
import { RepairModal } from './RepairModal'

export default function RepairsPage() {
  const {
    repairs,
    totalCount,
    loading,
    statusFilter,
    setStatusFilter,
    fetchRepairs,
    saveRepair,
    updateRepairStatus,
  } = useRepairs()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState(null)

  useEffect(() => {
    fetchRepairs(page, search)
  }, [fetchRepairs, page, search])

  const handleOpenCreate = () => {
    setSelectedRepair(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (repair) => {
    setSelectedRepair(repair)
    setIsModalOpen(true)
  }

  const handleStatusQuickChange = async (id, newStatus) => {
    try {
      await updateRepairStatus(id, newStatus)
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message)
    }
  }

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    ...Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v.label }))
  ]

  const totalPages = Math.ceil(totalCount / 12) || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Wrench className="text-rose-500" />
            Servicio Técnico y Reparaciones de Motos
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Seguimiento de trabajos en taller, fallas declaradas y saldos a cobrar
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} />
          Nueva Orden de Taller
        </Button>
      </div>

      {/* Filtros */}
      <Card className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            icon={Search}
            placeholder="Buscar por cliente, modelo de moto, placa o falla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Lista de Trabajos */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : repairs.length === 0 ? (
        <Card className="py-12 text-center text-gray-500 text-xs">
          No hay órdenes de reparación en este estado.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repairs.map((item) => {
            const statusConfig = REPAIR_STATUS_LABELS[item.status] || REPAIR_STATUS_LABELS.recibido
            const pendingBalance = Math.max(0, (item.estimated_total_bs || 0) - (item.advance_payment_bs || 0))

            return (
              <Card key={item.id} className="flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400">#{item.id.substring(0, 8)}</span>
                      <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                        {item.moto_model}
                        {item.moto_plate && (
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300">
                            {item.moto_plate}
                          </span>
                        )}
                      </h3>
                    </div>

                    <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-300 flex items-center gap-4">
                    <span>👤 <strong>{item.client_name}</strong></span>
                    {item.client_phone && (
                      <a href={`https://wa.me/591${item.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                        <Phone size={12} /> {item.client_phone}
                      </a>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800/80 text-xs text-gray-300">
                    <strong className="text-gray-400 block text-[10px] uppercase mb-0.5">Trabajo a realizar:</strong>
                    {item.issue_description}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block">Costo / Adelanto:</span>
                    <span className="font-semibold text-gray-200">
                      {formatBs(item.estimated_total_bs)} / <span className="text-emerald-400">{formatBs(item.advance_payment_bs)}</span>
                    </span>
                    {pendingBalance > 0 && (
                      <span className="block text-[11px] text-amber-400 font-bold">
                        Saldo a cobrar: {formatBs(pendingBalance)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(item)}>
                      Editar
                    </Button>
                    
                    {item.status !== 'entregado' && (
                      <select
                        className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                        value={item.status}
                        onChange={(e) => handleStatusQuickChange(item.id, e.target.value)}
                      >
                        <option value="recibido">Recibido</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="listo">Listo</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        onPageChange={setPage}
      />

      <RepairModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        repair={selectedRepair}
        onSave={saveRepair}
      />
    </div>
  )
}
