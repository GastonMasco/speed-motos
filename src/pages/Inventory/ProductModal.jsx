import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Upload, Package, Barcode, DollarSign, Tag, Wrench, Building2 } from 'lucide-react'

export const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  suppliers = [],
  categories = [],
  onSave,
  currentUserId = null,
}) => {
  const [formData, setFormData] = useState({
    sku_interno: '',
    codigo_proveedor: '',
    proveedor_id: '',
    marca: '',
    nombre: '',
    compatibilidad: '',
    categoria: 'frenos',
    unidad: 'PZA',
    precio_costo: '',
    precio_venta: '',
    stock: '0',
    stock_minimo: '5',
    estado: 'activo',
    image_url: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const standardCategories = [
    { value: 'frenos', label: 'Frenos' },
    { value: 'llantas', label: 'Llantas y Cámaras' },
    { value: 'transmision', label: 'Transmisión' },
    { value: 'plasticos', label: 'Plásticos y Carenado' },
    { value: 'filtros', label: 'Filtros' },
    { value: 'lubricantes', label: 'Lubricantes y Químicos' },
    { value: 'electricidad', label: 'Electricidad y Baterías' },
    { value: 'motor', label: 'Motor' },
    { value: 'varios', label: 'Varios / Accesorios' },
  ]

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        sku_interno: product.sku_interno || product.code || '',
        codigo_proveedor: product.codigo_proveedor || '',
        proveedor_id: product.proveedor_id || '',
        marca: product.marca || '',
        nombre: product.nombre || product.name || '',
        compatibilidad: Array.isArray(product.compatibilidad)
          ? product.compatibilidad.join(', ')
          : product.compatibilidad || product.description || '',
        categoria: product.categoria || 'frenos',
        unidad: product.unidad || 'PZA',
        precio_costo: product.precio_costo ?? product.cost_bs ?? '',
        precio_venta: product.precio_venta ?? product.price_bs ?? '',
        stock: product.stock ?? '0',
        stock_minimo: product.stock_minimo ?? product.min_stock ?? '5',
        estado: product.estado || 'activo',
        image_url: product.image_url || '',
      })
      setPreviewUrl(product.image_url || '')
    } else {
      setFormData({
        sku_interno: '',
        codigo_proveedor: '',
        proveedor_id: suppliers[0]?.id || '',
        marca: 'RAOPKS',
        nombre: '',
        compatibilidad: '',
        categoria: 'frenos',
        unidad: 'PZA',
        precio_costo: '',
        precio_venta: '',
        stock: '0',
        stock_minimo: '5',
        estado: 'activo',
        image_url: '',
      })
      setPreviewUrl('')
    }
    setImageFile(null)
    setError('')
  }, [product, suppliers, isOpen])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre.trim()) {
      setError('El nombre del repuesto es obligatorio.')
      return
    }

    if (!formData.precio_venta || Number(formData.precio_venta) <= 0) {
      setError('El precio de venta debe ser mayor a 0 Bs.')
      return
    }

    setLoading(true)
    try {
      await onSave(formData, imageFile, currentUserId)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  const supplierOptions = [
    { value: '', label: '-- Sin Proveedor --' },
    ...suppliers.map(s => ({ value: s.id, label: s.nombre }))
  ]

  const unidadOptions = [
    { value: 'PZA', label: 'Pieza (PZA)' },
    { value: 'PAR', label: 'Par (PAR)' },
    { value: 'JGO', label: 'Juego (JGO)' },
    { value: 'KIT', label: 'Kit Completo (KIT)' },
  ]

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'descontinuado', label: 'Descontinuado' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Repuesto / Accesorio' : 'Registrar Nuevo Repuesto'}
      maxWidth="max-w-2xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identificadores y Marca */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="SKU Interno (Opcional)"
            icon={Barcode}
            placeholder="Autogenerado si está vacío"
            value={formData.sku_interno}
            onChange={(e) => setFormData({ ...formData, sku_interno: e.target.value })}
          />

          <Input
            label="Código de Proveedor"
            icon={Tag}
            placeholder="EJ: BK-F01"
            value={formData.codigo_proveedor}
            onChange={(e) => setFormData({ ...formData, codigo_proveedor: e.target.value })}
          />

          <Input
            label="Marca *"
            icon={Wrench}
            placeholder="Ej: RAOPKS, GPR, VEDAMOTORS"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            required
          />
        </div>

        {/* Nombre y Proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Nombre del Producto *"
              icon={Package}
              placeholder="Ej: Pastilla de Freno Delantera Cerámica"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <Select
            label="Proveedor"
            icon={Building2}
            options={supplierOptions}
            value={formData.proveedor_id}
            onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
          />
        </div>

        {/* Categoría, Unidad y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Categoría *"
            options={standardCategories}
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          />

          <Select
            label="Unidad de Medida *"
            options={unidadOptions}
            value={formData.unidad}
            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
          />

          <Select
            label="Estado *"
            options={estadoOptions}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          />
        </div>

        {/* Compatibilidad de Motos */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Compatibilidad con Modelos de Moto (Separar por comas)
          </label>
          <input
            type="text"
            className="block w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Ej: CRF230, XR200, Tornado 250, CB190R"
            value={formData.compatibilidad}
            onChange={(e) => setFormData({ ...formData, compatibilidad: e.target.value })}
          />
          <span className="text-[10px] text-gray-500 mt-1 block">
            Permite a los vendedores buscar rápidamente por modelo de motocicleta.
          </span>
        </div>

        {/* Precios y Stock */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          <Input
            label="Precio Venta (Bs.) *"
            type="number"
            step="0.5"
            icon={DollarSign}
            placeholder="0.00"
            value={formData.precio_venta}
            onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
            required
          />

          <Input
            label="Precio Costo (Bs.)"
            type="number"
            step="0.5"
            placeholder="0.00"
            value={formData.precio_costo}
            onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
          />

          <Input
            label="Stock Actual *"
            type="number"
            placeholder="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
          />

          <Input
            label="Stock Mínimo Alerta"
            type="number"
            placeholder="5"
            value={formData.stock_minimo}
            onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
          />
        </div>

        {/* Imagen del producto con optimizador WebP */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="block text-xs font-medium text-gray-300">
            Imagen del Producto (Compresión WebP automática)
          </label>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                className="w-16 h-16 object-cover rounded-lg border border-gray-700 bg-gray-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dashed border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                Sin Foto
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-200 transition-colors">
              <Upload size={16} />
              <span>{previewUrl ? 'Cambiar Foto' : 'Subir Imagen'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {product ? 'Guardar Cambios' : 'Crear Repuesto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
