import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { History, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Package } from 'lucide-react'

export const ProductHistoryModal = ({
  isOpen,
  onClose,
  product = null,
  fetchMovements,
}) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && product?.id) {
      setLoading(true)
      fetchMovements(product.id)
        .then(data => setMovements(data))
        .catch(err => console.error('Error cargando historial:', err))
        .finally(() => setLoading(false))
    }
  }, [isOpen, product, fetchMovements])

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeBadge = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <ArrowUpRight size={12} /> Entrada
          </Badge>
        )
      case 'salida':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <ArrowDownRight size={12} /> Salida
          </Badge>
        )
      case 'ajuste':
      default:
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <RefreshCw size={12} /> Ajuste
          </Badge>
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History className="text-rose-500" size={20} />
          <span>Historial de Movimientos</span>
        </div>
      }
      maxWidth="max-w-xl"
    >
      {product && (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-rose-400 font-mono font-semibold uppercase">
              {product.sku_interno || product.code}
            </span>
            <h4 className="text-sm font-bold text-gray-100">{product.nombre}</h4>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Stock Actual:</span>
            <span className="text-sm font-extrabold text-emerald-400">{product.stock} un.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
          Cargando registro de movimientos...
        </div>
      ) : movements.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <Package size={36} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">No hay movimientos registrados para este repuesto.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {movements.map((mov) => (
            <div
              key={mov.id}
              className="p-3 bg-gray-800/60 border border-gray-700/60 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeBadge(mov.tipo)}
                  <span className="text-gray-300 font-medium">
                    {mov.motivo || 'Sin detalle de motivo'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(mov.created_at)}
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-black ${
                  mov.cantidad > 0 ? 'text-emerald-400' : mov.cantidad < 0 ? 'text-rose-400' : 'text-gray-300'
                }`}>
                  {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                </span>
                <span className="block text-[10px] text-gray-500 uppercase font-mono">unidades</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
