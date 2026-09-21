import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { User, Phone, Wrench, DollarSign, FileText } from 'lucide-react'
import { REPAIR_STATUS_LABELS } from '../../utils/constants'

export const RepairModal = ({
  isOpen,
  onClose,
  repair = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    moto_model: '',
    moto_plate: '',
    issue_description: '',
    status: 'recibido',
    estimated_total_bs: '',
    advance_payment_bs: '0',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (repair) {
      setFormData({
        id: repair.id,
        client_name: repair.client_name || '',
        client_phone: repair.client_phone || '',
        moto_model: repair.moto_model || '',
        moto_plate: repair.moto_plate || '',
        issue_description: repair.issue_description || '',
        status: repair.status || 'recibido',
        estimated_total_bs: repair.estimated_total_bs ?? '',
        advance_payment_bs: repair.advance_payment_bs ?? '0',
      })
    } else {
      setFormData({
        client_name: '',
        client_phone: '',
        moto_model: '',
        moto_plate: '',
        issue_description: '',
        status: 'recibido',
        estimated_total_bs: '',
        advance_payment_bs: '0',
      })
    }
    setError('')
  }, [repair, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.client_name.trim()) {
      setError('El nombre del cliente es obligatorio.')
      return
    }

    if (!formData.moto_model.trim()) {
      setError('El modelo de la moto es obligatorio.')
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar la orden de trabajo.')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = Object.entries(REPAIR_STATUS_LABELS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={repair ? 'Editar Orden de Reparación' : 'Registrar Trabajo de Taller'}
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre del Cliente *"
            icon={User}
            placeholder="Ej: Carlos Mamani"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            required
          />

          <Input
            label="Teléfono / WhatsApp"
            icon={Phone}
            placeholder="Ej: 71234567"
            value={formData.client_phone}
            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Modelo y Marca de Moto *"
            icon={Wrench}
            placeholder="Ej: Honda Wave 110 / Pulsar 200"
            value={formData.moto_model}
            onChange={(e) => setFormData({ ...formData, moto_model: e.target.value })}
            required
          />

          <Input
            label="Placa de la Moto"
            placeholder="Ej: 4521-ABC"
            value={formData.moto_plate}
            onChange={(e) => setFormData({ ...formData, moto_plate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Falla Declarada / Trabajo a Realizar *
          </label>
          <textarea
            rows="3"
            className="block w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Ej: Cambio de aceite, regulación de válvulas, limpieza de carburador..."
            value={formData.issue_description}
            onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Estado del Trabajo"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />

          <Input
            label="Costo Estimado (Bs.)"
            type="number"
            icon={DollarSign}
            placeholder="0.00"
            value={formData.estimated_total_bs}
            onChange={(e) => setFormData({ ...formData, estimated_total_bs: e.target.value })}
          />

          <Input
            label="Adelanto / Cuota (Bs.)"
            type="number"
            placeholder="0.00"
            value={formData.advance_payment_bs}
            onChange={(e) => setFormData({ ...formData, advance_payment_bs: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {repair ? 'Guardar Cambios' : 'Registrar Orden'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
