import { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/common/Pagination'
import { formatBs } from '../../utils/formatters'
import { CheckCircle, AlertTriangle, Percent, Package, Sparkles, Filter } from 'lucide-react'

export const ReviewListModal = ({
  isOpen,
  onClose,
  listId = null,
  listName = '',
  fetchItems,
  onConfirmImport,
  currentUserId,
}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalMarkup, setGlobalMarkup] = useState('40')
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const itemsPerPage = 30

  useEffect(() => {
    if (isOpen && listId) {
      setLoading(true)
      setError('')
      setPage(1)

      fetchItems(listId)
        .then((data) => {
          // Calcular precio_venta_sugerido inicial (+40%)
          const markupFactor = 1 + (Number(globalMarkup) / 100)
          const formatted = data.map((it) => {
            const cost = Number(it.precio_costo) || 0
            const suggestedSale = cost > 0 ? Math.round(cost * markupFactor * 100) / 100 : 0
            return {
              ...it,
              precio_venta_sugerido: suggestedSale,
              stock_inicial: it.estado_producto === 'agotado' ? 0 : 5,
            }
          })
          setItems(formatted)
        })
        .catch((err) => setError(err.message || 'Error cargando ítems de la lista.'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, listId, fetchItems])

  // Recalcular markup de todos los ítems al cambiar el markup global
  const handleApplyGlobalMarkup = (newMarkup) => {
    setGlobalMarkup(newMarkup)
    const factor = 1 + (Number(newMarkup) / 100)
    setItems((prevItems) =>
      prevItems.map((it) => {
        const cost = Number(it.precio_costo) || 0
        return {
          ...it,
          precio_venta_sugerido: cost > 0 ? Math.round(cost * factor * 100) / 100 : it.precio_venta_sugerido,
        }
      })
    )
  }

  // Modificar un campo de un ítem directamente en la celda
  const handleCellChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value }

          // Recalcular precio sugerido si cambia el precio de costo
          if (field === 'precio_costo') {
            const cost = Number(value) || 0
            const factor = 1 + (Number(globalMarkup) / 100)
            updated.precio_venta_sugerido = cost > 0 ? Math.round(cost * factor * 100) / 100 : 0
          }

          return updated
        }
        return it
      })
    )
  }

  // Alternar incluir todos
  const handleToggleSelectAll = (checked) => {
    setItems((prevItems) => prevItems.map((it) => ({ ...it, incluir: checked })))
  }

  // Confirmar importación
  const handleImportSubmit = async () => {
    const includedItems = items.filter((it) => it.incluir)
    if (includedItems.length === 0) {
      setError('Debes seleccionar al menos un producto para importar.')
      return
    }

    setImporting(true)
    setError('')
    try {
      await onConfirmImport(listId, items, currentUserId)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al importar repuestos a la base de datos.')
    } finally {
      setImporting(false)
    }
  }

  // Paginación
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1
  const paginatedItems = useMemo(() => {
    const from = (page - 1) * itemsPerPage
    return items.slice(from, from + itemsPerPage)
  }, [items, page])

  const categoryOptions = [
    { value: 'frenos', label: 'Frenos' },
    { value: 'llantas', label: 'Llantas' },
    { value: 'transmision', label: 'Transmisión' },
    { value: 'plasticos', label: 'Plásticos' },
    { value: 'filtros', label: 'Filtros' },
    { value: 'lubricantes', label: 'Lubricantes' },
    { value: 'electricidad', label: 'Electricidad' },
    { value: 'motor', label: 'Motor' },
    { value: 'varios', label: 'Varios' },
  ]

  const unidadOptions = [
    { value: 'PZA', label: 'PZA' },
    { value: 'PAR', label: 'PAR' },
    { value: 'JGO', label: 'JGO' },
    { value: 'KIT', label: 'KIT' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="text-rose-500" size={20} />
          <span>Revisión de Lista de Precios PDF: {listName}</span>
        </div>
      }
      maxWidth="max-w-6xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Barra Superior de Ajustes de Margen y Selección */}
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-gray-950 border-gray-700"
              />
              <span>Seleccionar Todos ({items.filter((i) => i.incluir).length} / {items.length})</span>
            </label>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-800">
              <span className="text-gray-400">Margen de Ganancia Global:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="500"
                  className="w-16 h-8 text-center bg-gray-950 border border-gray-700 rounded-lg text-xs font-bold text-emerald-400 focus:ring-rose-500"
                  value={globalMarkup}
                  onChange={(e) => handleApplyGlobalMarkup(e.target.value)}
                />
                <span className="text-gray-300 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="w-3 h-3 bg-amber-500/30 border border-amber-500 rounded-sm"></span>
            <span>Confianza IA Baja (Revisión sugerida)</span>
          </div>
        </div>

        {/* Tabla Editable */}
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400 animate-pulse">
            Cargando repuestos extraídos por la IA...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No se encontraron repuestos válidos en esta lista.
          </div>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-x-auto bg-gray-950/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-[10px] uppercase font-semibold border-b border-gray-800">
                  <th className="p-2 text-center w-10">Inc.</th>
                  <th className="p-2 min-w-[100px]">Código</th>
                  <th className="p-2 min-w-[200px]">Nombre del Repuesto</th>
                  <th className="p-2 min-w-[110px]">Marca</th>
                  <th className="p-2 min-w-[120px]">Categoría</th>
                  <th className="p-2 min-w-[140px]">Compatibilidad</th>
                  <th className="p-2 min-w-[70px]">Unidad</th>
                  <th className="p-2 min-w-[90px] text-right">Costo (Bs.)</th>
                  <th className="p-2 min-w-[100px] text-right">Venta Sug. (Bs.)</th>
                  <th className="p-2 min-w-[80px] text-center">Estado</th>
                  <th className="p-2 min-w-[70px] text-center">Confianza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {paginatedItems.map((item) => {
                  const isLowConf = item.confianza_ia === 'baja'
                  const isAgotado = item.estado_producto === 'agotado'
                  const isOferta = item.estado_producto === 'oferta_especial'

                  return (
                    <tr
                      key={item.id}
                      className={`
                        transition-colors
                        ${isLowConf ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-gray-900/60'}
                        ${!item.incluir ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Checkbox Incluir */}
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.incluir}
                          onChange={(e) => handleCellChange(item.id, 'incluir', e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-gray-900 border-gray-700"
                        />
                      </td>

                      {/* Código Proveedor */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.codigo_proveedor || ''}
                          onChange={(e) => handleCellChange(item.id, 'codigo_proveedor', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 font-mono text-[11px] text-rose-400 focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Nombre */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.nombre}
                          onChange={(e) => handleCellChange(item.id, 'nombre', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 font-semibold text-gray-100 focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Marca */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.marca}
                          onChange={(e) => handleCellChange(item.id, 'marca', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Categoría */}
                      <td className="p-2">
                        <select
                          value={item.categoria_sugerida}
                          onChange={(e) => handleCellChange(item.id, 'categoria_sugerida', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-rose-500"
                        >
                          {categoryOptions.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Compatibilidad (Tags comas) */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={Array.isArray(item.compatibilidad_sugerida) ? item.compatibilidad_sugerida.join(', ') : ''}
                          onChange={(e) => handleCellChange(
                            item.id,
                            'compatibilidad_sugerida',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )}
                          placeholder="CRF230, XR200"
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-gray-300 text-[11px] focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Unidad */}
                      <td className="p-2">
                        <select
                          value={item.unidad}
                          onChange={(e) => handleCellChange(item.id, 'unidad', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-gray-200 text-[11px] focus:outline-none focus:border-rose-500"
                        >
                          {unidadOptions.map((u) => (
                            <option key={u.value} value={u.value}>{u.value}</option>
                          ))}
                        </select>
                      </td>

                      {/* Precio Costo */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={item.precio_costo ?? ''}
                          placeholder={isAgotado ? 'Agotado' : '0.00'}
                          onChange={(e) => handleCellChange(item.id, 'precio_costo', e.target.value)}
                          className="w-20 text-right bg-gray-900 border border-gray-800 rounded px-2 py-1 font-mono text-gray-200 focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Precio Venta Sugerido */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={item.precio_venta_sugerido ?? ''}
                          onChange={(e) => handleCellChange(item.id, 'precio_venta_sugerido', e.target.value)}
                          className="w-20 text-right bg-gray-900 border border-gray-800 rounded px-2 py-1 font-mono font-bold text-emerald-400 focus:outline-none focus:border-rose-500"
                        />
                      </td>

                      {/* Estado Producto */}
                      <td className="p-2 text-center">
                        {isAgotado && <Badge variant="danger" className="text-[9px]">Agotado</Badge>}
                        {isOferta && <Badge variant="warning" className="text-[9px]">Oferta</Badge>}
                        {!isAgotado && !isOferta && <Badge variant="success" className="text-[9px]">OK</Badge>}
                      </td>

                      {/* Confianza IA */}
                      <td className="p-2 text-center">
                        {isLowConf ? (
                          <span className="text-amber-400 text-[10px] font-bold">⚠️ Baja</span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Alta</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={items.length}
          onPageChange={setPage}
        />

        {/* Botones de Acción */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-400">
            Se importarán <strong className="text-rose-400">{items.filter((i) => i.incluir).length}</strong> repuestos al inventario de Speed Rao Motos.
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={importing}>
              Cancelar
            </Button>
            <Button
              onClick={handleImportSubmit}
              loading={importing}
              disabled={items.length === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Confirmar e Importar a Inventario
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
