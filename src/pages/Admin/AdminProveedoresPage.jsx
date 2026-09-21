import { useState } from 'react'
import { Truck, Plus, Upload, FileText, Sparkles, CheckCircle, Clock, AlertCircle, Eye, Building2, Phone, Calendar } from 'lucide-react'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ReviewListModal } from './ReviewListModal'

export default function AdminProveedoresPage() {
  const { user } = useAuth()
  const {
    suppliers,
    listsHistory,
    loading,
    createSupplier,
    processPdfPriceList,
    fetchExtractedItems,
    confirmAndImportList,
  } = useSuppliers()

  // Modal Nuevo Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [newSupplierData, setNewSupplierData] = useState({ nombre: '', telefono: '', notas: '' })
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierError, setSupplierError] = useState('')

  // Modal Subir PDF
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [fechaListaText, setFechaListaText] = useState('Septiembre 2026')
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Modal Revisión
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewListTarget, setReviewListTarget] = useState(null)

  // Crear Proveedor
  const handleCreateSupplierSubmit = async (e) => {
    e.preventDefault()
    setSupplierError('')
    setSupplierLoading(true)

    try {
      await createSupplier(newSupplierData)
      setNewSupplierData({ nombre: '', telefono: '', notas: '' })
      setIsSupplierModalOpen(false)
    } catch (err) {
      setSupplierError(err.message || 'Error al guardar el proveedor.')
    } finally {
      setSupplierLoading(false)
    }
  }

  // Subir y Procesar PDF con Gemini AI
  const handleUploadPdfSubmit = async (e) => {
    e.preventDefault()
    setUploadError('')

    if (!selectedSupplierId) {
      setUploadError('Por favor selecciona un proveedor.')
      return
    }

    if (!pdfFile) {
      setUploadError('Por favor selecciona un archivo PDF válido.')
      return
    }

    setUploadProcessing(true)
    try {
      const listId = await processPdfPriceList({
        supplierId: selectedSupplierId,
        pdfFile,
        fechaLista: fechaListaText,
      })

      // Abrir modal de revisión directamente
      const targetSupplier = suppliers.find((s) => s.id === selectedSupplierId)
      setReviewListTarget({
        id: listId,
        name: `${targetSupplier?.nombre || 'Proveedor'} - ${pdfFile.name}`,
      })

      setIsUploadModalOpen(false)
      setPdfFile(null)
      setIsReviewModalOpen(true)
    } catch (err) {
      setUploadError(err.message || 'Error al procesar la lista PDF.')
    } finally {
      setUploadProcessing(false)
    }
  }

  const handleOpenReview = (list) => {
    setReviewListTarget({
      id: list.id,
      name: `${list.proveedores?.nombre || 'Proveedor'} - ${list.nombre_archivo}`,
    })
    setIsReviewModalOpen(true)
  }

  const supplierOptions = [
    { value: '', label: '-- Seleccionar Proveedor --' },
    ...suppliers.map((s) => ({ value: s.id, label: s.nombre }))
  ]

  // Buscar última fecha de lista por proveedor
  const getLastListDate = (supplierId) => {
    const found = listsHistory.find((l) => l.proveedor_id === supplierId)
    return found ? found.fecha_lista : 'Sin listas cargadas'
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Truck className="text-rose-500" />
            Gestión de Proveedores y Listas PDF con IA
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Lectura automática de catálogos en PDF usando Gemini API y actualización masiva de precios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsSupplierModalOpen(true)}
            className="flex items-center gap-2 text-xs"
          >
            <Plus size={16} />
            Nuevo Proveedor
          </Button>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 text-xs shadow-lg shadow-rose-900/30"
          >
            <Upload size={16} />
            Subir Lista PDF (IA)
          </Button>
        </div>
      </div>

      {/* Tarjetas de Proveedores Principal */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Directorio de Proveedores & Importadores
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-900 border border-gray-800 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => {
              const lastDate = getLastListDate(sup.id)
              return (
                <Card
                  key={sup.id}
                  className="p-4 flex flex-col justify-between hover:border-rose-500/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                        <Building2 size={18} />
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        📅 {lastDate}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-gray-100 group-hover:text-rose-400 transition-colors">
                      {sup.nombre}
                    </h3>

                    {sup.telefono && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Phone size={12} className="text-emerald-400" /> {sup.telefono}
                      </p>
                    )}

                    {sup.notas && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                        {sup.notas}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedSupplierId(sup.id)
                        setIsUploadModalOpen(true)
                      }}
                      className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Upload size={14} /> Subir Lista PDF
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de Listas Subidas y Procesadas */}
      <div className="pt-4 border-t border-gray-800">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Historial de Listas de Precios Procesadas con IA
        </h2>

        {listsHistory.length === 0 ? (
          <Card className="py-10 text-center text-gray-500 text-xs">
            No se han subido listas de precios en PDF aún.
          </Card>
        ) : (
          <div className="space-y-3">
            {listsHistory.map((list) => {
              const isPending = list.estado === 'pendiente_revision'
              const isConfirmed = list.estado === 'confirmada'
              const isProcessing = list.estado === 'procesando'
              const itemsCount = list.items_extraidos?.[0]?.count || 0

              return (
                <Card
                  key={list.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText size={16} className="text-rose-400" />
                      <h4 className="text-sm font-bold text-gray-100">{list.nombre_archivo}</h4>

                      {isProcessing && (
                        <Badge variant="warning" className="text-[10px] animate-pulse">
                          ⏳ Procesando con IA...
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="warning" className="text-[10px]">
                          ⚠️ Pendiente de Revisión
                        </Badge>
                      )}
                      {isConfirmed && (
                        <Badge variant="success" className="text-[10px]">
                          ✓ Importada al Inventario
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>Proveedor: <strong className="text-gray-200">{list.proveedores?.nombre}</strong></span>
                      <span>• Periodo: {list.fecha_lista}</span>
                      <span>• Repuestos extraídos: <strong className="text-rose-400">{itemsCount}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant={isPending ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleOpenReview(list)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Eye size={14} />
                      {isPending ? 'Revisar e Importar' : 'Ver Detalles'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Proveedor */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Registrar Nuevo Proveedor"
        maxWidth="max-w-md"
      >
        {supplierError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{supplierError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSupplierSubmit} className="space-y-4">
          <Input
            label="Nombre del Proveedor / Empresa *"
            icon={Building2}
            placeholder="Ej: Biker Bolivia"
            value={newSupplierData.nombre}
            onChange={(e) => setNewSupplierData({ ...newSupplierData, nombre: e.target.value })}
            required
          />

          <Input
            label="Teléfono / Celular de Contacto"
            icon={Phone}
            placeholder="+591 71234567"
            value={newSupplierData.telefono}
            onChange={(e) => setNewSupplierData({ ...newSupplierData, telefono: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Notas u Observaciones</label>
            <textarea
              rows="2"
              className="block w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Importador directo de Brasil, condiciones de pago..."
              value={newSupplierData.notas}
              onChange={(e) => setNewSupplierData({ ...newSupplierData, notas: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setIsSupplierModalOpen(false)} disabled={supplierLoading}>
              Cancelar
            </Button>
            <Button type="submit" loading={supplierLoading}>
              Guardar Proveedor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Subir PDF con Extractor IA */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={20} />
            <span>Extraer Lista de Precios PDF con IA</span>
          </div>
        }
        maxWidth="max-w-md"
      >
        {uploadError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadPdfSubmit} className="space-y-4">
          <Select
            label="Seleccionar Proveedor *"
            icon={Building2}
            options={supplierOptions}
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            required
          />

          <Input
            label="Periodo / Identificador de la Lista"
            icon={Calendar}
            placeholder="Ej: Septiembre 2026"
            value={fechaListaText}
            onChange={(e) => setFechaListaText(e.target.value)}
          />

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300">
              Seleccionar Archivo PDF *
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0] || null)}
              className="block w-full text-xs text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-500 border border-gray-800 rounded-xl bg-gray-950 p-2 cursor-pointer"
              required
            />
          </div>

          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-[11px] text-gray-400 leading-relaxed">
            💡 <strong className="text-gray-200">Procesamiento con Gemini 1.5 Flash:</strong> La IA analizará las tablas, detectará repuestos agotados, ofertas, unidades de medida y la compatibilidad con modelos de moto.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)} disabled={uploadProcessing}>
              Cancelar
            </Button>
            <Button type="submit" loading={uploadProcessing} className="flex items-center gap-2">
              <Sparkles size={16} />
              Analizar con IA
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Revisión Editable */}
      <ReviewListModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        listId={reviewListTarget?.id}
        listName={reviewListTarget?.name}
        fetchItems={fetchExtractedItems}
        onConfirmImport={confirmAndImportList}
        currentUserId={user?.id}
      />
    </div>
  )
}
