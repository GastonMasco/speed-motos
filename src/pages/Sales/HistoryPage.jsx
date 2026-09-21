import { useEffect, useState } from 'react'
import { useSales } from '../../hooks/useSales'
import { useVendedores } from '../../hooks/useVendedores'
import { useAuth } from '../../context/AuthContext'
import { formatBs, formatDate } from '../../utils/formatters'
import { PAYMENT_METHODS } from '../../utils/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/common/Pagination'
import { ReceiptModal } from './ReceiptModal'
import { History, FileText, User, Calendar, AlertTriangle, ShieldAlert, CheckCircle, Share2, Ban, Filter, Phone } from 'lucide-react'

export default function HistoryPage() {
  const { isAdmin, profile, user } = useAuth()
  const { salesHistory, historyTotalCount, fetchSalesHistory, anularVenta, loading } = useSales()
  const { vendedores } = useVendedores()

  const [page, setPage] = useState(1)
  const [sellerIdFilter, setSellerIdFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')

  // Modal de comprobante / reimpresión
  const [selectedSale, setSelectedSale] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Modal de anulación de venta (Admin)
  const [cancelSaleTarget, setCancelSaleTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    fetchSalesHistory({
      page,
      sellerId: sellerIdFilter,
      startDate,
      endDate,
      paymentMethod: paymentFilter,
      forcedSellerId: isAdmin ? null : profile?.id,
    })
  }, [fetchSalesHistory, page, sellerIdFilter, startDate, endDate, paymentFilter, isAdmin, profile])

  const handleOpenReceipt = (sale) => {
    setSelectedSale(sale)
    setIsReceiptModalOpen(true)
  }

  const handleOpenCancelModal = (sale) => {
    setCancelSaleTarget(sale)
    setCancelReason('')
    setCancelError('')
  }

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      setCancelError('Es obligatorio especificar un motivo de anulación.')
      return
    }

    setCancelLoading(true)
    setCancelError('')
    try {
      await anularVenta(cancelSaleTarget.id, cancelReason.trim(), user?.id)
      setCancelSaleTarget(null)
      setCancelReason('')
      // Recargar historial
      fetchSalesHistory({
        page,
        sellerId: sellerIdFilter,
        startDate,
        endDate,
        paymentMethod: paymentFilter,
        forcedSellerId: isAdmin ? null : profile?.id,
      })
    } catch (err) {
      setCancelError(err.message || 'Error al anular la venta.')
    } finally {
      setCancelLoading(false)
    }
  }

  const applyDatePreset = (preset) => {
    const today = new Date()
    const formatDateStr = (d) => d.toISOString().split('T')[0]

    if (preset === 'today') {
      const str = formatDateStr(today)
      setStartDate(str)
      setEndDate(str)
    } else if (preset === 'week') {
      const firstDay = new Date(today)
      const dayOfWeek = today.getDay() || 7
      firstDay.setDate(today.getDate() - dayOfWeek + 1)
      setStartDate(formatDateStr(firstDay))
      setEndDate(formatDateStr(today))
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatDateStr(firstDay))
      setEndDate(formatDateStr(today))
    } else if (preset === 'all') {
      setStartDate('')
      setEndDate('')
    }
    setPage(1)
  }

  const totalPages = Math.ceil(historyTotalCount / 30) || 1

  const sellerOptions = [
    { value: 'all', label: 'Todos los Vendedores' },
    ...vendedores.map(v => ({ value: v.id, label: v.nombre_completo || v.email }))
  ]

  const paymentOptions = [
    { value: 'all', label: 'Todos los Métodos de Pago' },
    ...PAYMENT_METHODS.map(m => ({ value: m.id, label: m.label }))
  ]

  // Cálculos de Margen y Reportes por Vendedor (SOLO ADMIN)
  const completedSales = salesHistory.filter(s => s.estado !== 'anulada')
  const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.total ?? s.total_bs ?? 0), 0)
  const totalCost = completedSales.reduce((sum, s) => {
    const items = s.venta_items || s.sale_items || []
    return sum + items.reduce((iSum, item) => {
      const qty = item.cantidad || item.quantity || 0
      const cost = Number(item.productos?.precio_costo ?? item.precio_costo ?? 0)
      return iSum + (qty * cost)
    }, 0)
  }, 0)
  const netProfit = totalRevenue - totalCost
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0

  // Resumen por vendedor
  const sellerStatsMap = {}
  completedSales.forEach(s => {
    const sellerId = s.vendedor_id || 'unassigned'
    const sellerName = s.profiles?.nombre_completo || s.profiles?.email || 'Desconocido'
    if (!sellerStatsMap[sellerId]) {
      sellerStatsMap[sellerId] = { name: sellerName, count: 0, total: 0 }
    }
    sellerStatsMap[sellerId].count += 1
    sellerStatsMap[sellerId].total += Number(s.total ?? s.total_bs ?? 0)
  })
  const sellerStats = Object.values(sellerStatsMap)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <History className="text-rose-500" />
            {isAdmin ? 'Historial Global & Reportes de Ventas' : 'Mis Ventas Registradas'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isAdmin
              ? 'Auditoría completa, margen de ganancia neta y rendimiento por vendedor'
              : 'Historial de tus ventas en Bolivianos (Bs.) con opción de comprobante'}
          </p>
        </div>

        {/* Botones de presets rápidos de fecha */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="secondary" size="sm" className="text-xs py-1" onClick={() => applyDatePreset('today')}>
            Hoy
          </Button>
          <Button variant="secondary" size="sm" className="text-xs py-1" onClick={() => applyDatePreset('week')}>
            Esta Semana
          </Button>
          <Button variant="secondary" size="sm" className="text-xs py-1" onClick={() => applyDatePreset('month')}>
            Este Mes
          </Button>
          <Button variant="ghost" size="sm" className="text-xs py-1 text-gray-400" onClick={() => applyDatePreset('all')}>
            Todo
          </Button>
        </div>
      </div>

      {/* Tarjetas Exclusivas de Administrador: Margen de Ganancia Neta y Rendimiento de Vendedores */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5 bg-gradient-to-br from-gray-900 via-gray-900 to-rose-950/20 border-gray-800">
            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={15} className="text-rose-400" />
                Margen de Ganancia Neta (Página/Filtro Actual)
              </span>
              <Badge variant="danger" className="text-[10px]">SOLO ADMIN</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center py-2">
              <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-400 block">Ventas Brutas</span>
                <span className="text-base font-bold text-emerald-400">{formatBs(totalRevenue)}</span>
              </div>
              <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-400 block">Costo de Productos</span>
                <span className="text-base font-bold text-rose-400">{formatBs(totalCost)}</span>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[11px] text-emerald-300 block font-semibold">Ganancia Neta</span>
                <span className="text-lg font-black text-emerald-300">{formatBs(netProfit)}</span>
                <span className="text-[10px] text-emerald-400 block font-mono">Margen: {profitMarginPercent}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-900 border-gray-800">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User size={14} className="text-rose-400" />
              Ventas por Vendedor
            </h3>
            {sellerStats.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">Sin ventas completadas en este filtro.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {sellerStats.map((st, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-gray-950/60 rounded-lg border border-gray-800/80">
                    <div>
                      <span className="font-semibold text-gray-200 block">{st.name}</span>
                      <span className="text-[10px] text-gray-400">{st.count} {st.count === 1 ? 'venta' : 'ventas'}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{formatBs(st.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Filtros de Búsqueda */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isAdmin && (
          <div>
            <Select
              icon={User}
              options={sellerOptions}
              value={sellerIdFilter}
              onChange={(e) => {
                setSellerIdFilter(e.target.value)
                setPage(1)
              }}
            />
          </div>
        )}

        <div>
          <Select
            icon={Filter}
            options={paymentOptions}
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <Input
            label="Fecha Desde"
            type="date"
            icon={Calendar}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <Input
            label="Fecha Hasta"
            type="date"
            icon={Calendar}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </Card>

      {/* Lista de Ventas */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : salesHistory.length === 0 ? (
        <Card className="py-12 text-center text-gray-500 text-xs">
          No se encontraron ventas con los filtros aplicados.
        </Card>
      ) : (
        <div className="space-y-3">
          {salesHistory.map((sale) => {
            const isCancelled = sale.estado === 'anulada'
            const items = sale.venta_items || sale.sale_items || []
            const numeroVenta = sale.numero_venta || `VEN-${sale.id.substring(0, 6).toUpperCase()}`

            return (
              <Card
                key={sale.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isCancelled ? 'opacity-60 bg-gray-950 border-rose-900/30' : 'hover:border-gray-700'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {numeroVenta}
                    </span>

                    {isCancelled ? (
                      <Badge variant="danger" className="text-[10px]">
                        🚫 ANULADA
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        ✓ COMPLETADA
                      </Badge>
                    )}

                    <Badge variant="neutral" className="text-[10px] uppercase font-mono">
                      {sale.metodo_pago || sale.payment_method}
                    </Badge>

                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(sale.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-200">
                    <span className="font-semibold flex items-center gap-1">
                      <User size={13} className="text-gray-400" />
                      Cliente: {sale.cliente_nombre || sale.client_name || 'Cliente Ocasional'}
                    </span>

                    {(sale.cliente_telefono || sale.client_phone) && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Phone size={11} /> {sale.cliente_telefono || sale.client_phone}
                      </span>
                    )}

                    {(sale.cliente_nit || sale.client_ci_nit) && (
                      <span className="text-gray-400">
                        NIT/CI: {sale.cliente_nit || sale.client_ci_nit}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-400">
                    Vendedor: <strong className="text-gray-300">{sale.profiles?.nombre_completo || sale.profiles?.full_name || 'Desconocido'}</strong>
                  </div>

                  {/* Resumen de repuestos en la venta */}
                  {items.length > 0 && (
                    <div className="pt-1.5 text-[11px] text-gray-400 flex flex-wrap gap-1.5">
                      {items.map((item, idx) => (
                        <span key={idx} className="bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800 font-mono">
                          {item.cantidad || item.quantity}x {item.producto?.nombre || item.productos?.name || 'Repuesto'} ({formatBs(item.precio_unitario || item.unit_price_bs)})
                        </span>
                      ))}
                    </div>
                  )}

                  {isCancelled && sale.motivo_anulacion && (
                    <div className="mt-1 p-2 bg-rose-950/30 border border-rose-900/40 rounded-lg text-[11px] text-rose-300">
                      ⚠️ <strong>Motivo Anulación:</strong> {sale.motivo_anulacion}
                    </div>
                  )}
                </div>

                {/* Monto y Botones */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 sm:border-l border-gray-800 sm:pl-4">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Monto Total:</span>
                    <span className={`text-base font-black ${isCancelled ? 'line-through text-gray-500' : 'text-emerald-400'}`}>
                      {formatBs(sale.total ?? sale.total_bs)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenReceipt(sale)}
                      className="flex items-center gap-1 text-xs"
                      title="Ver Comprobante"
                    >
                      <FileText size={14} />
                      Comprobante
                    </Button>

                    {isAdmin && !isCancelled && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenCancelModal(sale)}
                        className="flex items-center gap-1 text-xs"
                        title="Anular venta y devolver stock"
                      >
                        <Ban size={14} />
                        Anular
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={historyTotalCount}
        onPageChange={setPage}
      />

      {/* Modal Re-impresión Comprobante */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={selectedSale}
      />

      {/* Modal de Anulación de Venta (Admin) */}
      {isAdmin && (
        <Modal
          isOpen={!!cancelSaleTarget}
          onClose={() => setCancelSaleTarget(null)}
          title="Anular Venta y Devolver Stock"
          maxWidth="max-w-md"
        >
          {cancelError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{cancelError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmCancel} className="space-y-4">
            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-rose-300 font-bold">
                <span>Venta a Anular:</span>
                <span className="font-mono">{cancelSaleTarget?.numero_venta || cancelSaleTarget?.id?.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Monto a Reembolsar:</span>
                <span className="font-bold text-emerald-400">{formatBs(cancelSaleTarget?.total ?? cancelSaleTarget?.total_bs)}</span>
              </div>
              <p className="text-[11px] text-gray-400 pt-1">
                ⚠️ Al anular esta venta, se restituirá de forma automática el stock de todos los repuestos involucrados en el inventario.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Motivo Obligatorio de Anulación *
              </label>
              <textarea
                rows="3"
                className="block w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Ej: Cliente solicitó cancelación / Error en el método de pago registrado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setCancelSaleTarget(null)}
                disabled={cancelLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={cancelLoading}
                className="flex items-center gap-2"
              >
                <Ban size={16} />
                Confirmar Anulación
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
