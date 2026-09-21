import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Percent, TrendingUp, AlertCircle } from 'lucide-react'

export const BulkPriceModal = ({
  isOpen,
  onClose,
  categories = [],
  brands = [],
  onApply,
}) => {
  const [filterType, setFilterType] = useState('categoria') // 'categoria' | 'marca'
  const [targetValue, setTargetValue] = useState('')
  const [percentage, setPercentage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!targetValue) {
      setError(`Selecciona una ${filterType === 'categoria' ? 'categoría' : 'marca'} de la lista.`)
      return
    }

    const numPct = Number(percentage)
    if (isNaN(numPct) || numPct === 0) {
      setError('Ingresa un porcentaje válido (ej. 10 para aumentar 10% o -5 para descontar 5%).')
      return
    }

    setLoading(true)
    try {
      const updatedCount = await onApply({
        filterType,
        targetValue,
        percentage: numPct,
      })
      setSuccessMsg(`¡Éxito! Se actualizaron ${updatedCount} productos correctamente.`)
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Error al aplicar el ajuste masivo de precios.')
    } finally {
      setLoading(false)
    }
  }

  const targetOptions = filterType === 'categoria'
    ? categories.map(c => ({ value: c, label: c.toUpperCase() }))
    : brands.map(b => ({ value: b, label: b }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste Masivo de Precios de Venta"
      maxWidth="max-w-md"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <TrendingUp size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleApply} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">
            Aplicar ajuste por:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                filterType === 'categoria'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => {
                setFilterType('categoria')
                setTargetValue('')
              }}
            >
              Categoría
            </button>
            <button
              type="button"
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                filterType === 'marca'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => {
                setFilterType('marca')
                setTargetValue('')
              }}
            >
              Marca
            </button>
          </div>
        </div>

        <Select
          label={`Seleccionar ${filterType === 'categoria' ? 'Categoría' : 'Marca'}`}
          options={[
            { value: '', label: `-- Elegir ${filterType === 'categoria' ? 'Categoría' : 'Marca'} --` },
            ...targetOptions
          ]}
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
        />

        <Input
          label="Porcentaje de Ajuste (%)"
          type="number"
          step="0.5"
          icon={Percent}
          placeholder="Ej: 10 para +10% o -5 para -5%"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          required
        />

        <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-[11px] text-gray-400 leading-relaxed">
          ℹ️ <strong className="text-gray-200">Nota:</strong> Se recalculará el <code className="text-rose-400">precio_venta</code> de todos los productos de la {filterType} seleccionada. Los valores se redondearán a 2 decimales.
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex items-center gap-2">
            <TrendingUp size={16} />
            Aplicar Ajuste
          </Button>
        </div>
      </form>
    </Modal>
  )
}
