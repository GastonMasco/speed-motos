import { useState } from 'react'
import { Settings, Building2, DollarSign, Download, Upload, Percent, Save, CheckCircle, AlertCircle, Table, FileSpreadsheet, Percent as PercentIcon, RefreshCw } from 'lucide-react'
import { useBusinessConfig } from '../../hooks/useBusinessConfig'
import { useInventory } from '../../hooks/useInventory'
import { useSales } from '../../hooks/useSales'
import { useVendedores } from '../../hooks/useVendedores'
import { exportInventoryToExcel, exportSalesToExcel, exportSellersToExcel, parseExcelOrCsvFile } from '../../services/dataExporterImporter'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatBs } from '../../utils/formatters'

export default function AdminConfiguracionPage({ defaultTab = 'negocio' }) {
  const { config, updateConfig, loading: configLoading } = useBusinessConfig()
  const { products, refreshProducts } = useInventory()
  const { salesHistory } = useSales()
  const { vendedores } = useVendedores()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState(defaultTab) // 'negocio' | 'precios' | 'datos'

  // Estado Form Negocio
  const [businessForm, setBusinessForm] = useState({
    nombre_negocio: config.nombre_negocio,
    eslogan: config.eslogan,
    direccion: config.direccion,
    telefono: config.telefono,
    nit: config.nit,
  })

  // Estado Form Precios
  const [pricingForm, setPricingForm] = useState({
    markup_global_defecto: config.markup_global_defecto,
    descuento_maximo_vendedor: config.descuento_maximo_vendedor,
    markup_por_categoria: { ...config.markup_por_categoria },
  })

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // Estado Importación CSV/Excel
  const [importFile, setImportFile] = useState(null)
  const [parsedPreview, setParsedPreview] = useState([])
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)

  // Guardar Datos del Negocio
  const handleSaveBusiness = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    try {
      await updateConfig(businessForm)
      setMsg('¡Datos del negocio guardados exitosamente!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar datos del negocio.')
    } finally {
      setSaving(false)
    }
  }

  // Guardar Reglas de Precios y Descuento Máximo
  const handleSavePricing = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    setError('')
    try {
      await updateConfig(pricingForm)
      setMsg('¡Reglas de precio y descuento máximo actualizados!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar reglas de precios.')
    } finally {
      setSaving(false)
    }
  }

  // Cargar archivo CSV/Excel para vista previa
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportFile(file)
    setError('')
    try {
      const parsed = await parseExcelOrCsvFile(file)
      setParsedPreview(parsed)
      setIsImportModalOpen(true)
    } catch (err) {
      setError(err.message || 'Error leyendo la hoja de cálculo.')
    }
  }

  // Confirmar Importación Masiva
  const handleConfirmImport = async () => {
    const included = parsedPreview.filter((p) => p.incluir)
    if (included.length === 0) {
      alert('Debes incluir al menos un producto.')
      return
    }

    setImportLoading(true)
    try {
      // Importar repuestos a Supabase
      const { data, error: impErr } = await supabase.rpc('confirmar_e_importar_lista', {
        p_lista_id: null, // Carga directa sin lista PDF
        p_items: included,
        p_usuario_id: user?.id,
      })

      if (impErr) throw impErr

      await refreshProducts()
      setIsImportModalOpen(false)
      setParsedPreview([])
      alert('¡Importación masiva completada con éxito!')
    } catch (err) {
      alert('Error en importación: ' + err.message)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="text-rose-500" />
          Configuración y Administración Avanzada
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Administra los datos fiscales del negocio, reglas de precios y exportación/importación masiva
        </p>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-gray-800 gap-2">
        <button
          onClick={() => setActiveTab('negocio')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'negocio'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🏪 Datos del Negocio
        </button>
        <button
          onClick={() => setActiveTab('precios')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'precios'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          💰 Reglas de Precios & Descuentos
        </button>
        <button
          onClick={() => setActiveTab('datos')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'datos'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          📊 Exportar / Importar Datos (Excel)
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* PESTAÑA 1: DATOS DEL NEGOCIO */}
      {activeTab === 'negocio' && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Building2 size={18} className="text-rose-400" />
              Datos Fiscales de la Empresa (Encabezado de Comprobantes)
            </h3>

            <Input
              label="Nombre Comercial del Negocio *"
              placeholder="Ej: Speed Rao Motos"
              value={businessForm.nombre_negocio}
              onChange={(e) => setBusinessForm({ ...businessForm, nombre_negocio: e.target.value })}
              required
            />

            <Input
              label="Eslogan / Subtítulo"
              placeholder="Ej: Repuestos, Accesorios y Taller Especializado"
              value={businessForm.eslogan}
              onChange={(e) => setBusinessForm({ ...businessForm, eslogan: e.target.value })}
            />

            <Input
              label="Dirección Física del Local *"
              placeholder="La Paz, Bolivia"
              value={businessForm.direccion}
              onChange={(e) => setBusinessForm({ ...businessForm, direccion: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono / Celular *"
                placeholder="+591 71234567"
                value={businessForm.telefono}
                onChange={(e) => setBusinessForm({ ...businessForm, telefono: e.target.value })}
                required
              />

              <Input
                label="NIT *"
                placeholder="1028374029"
                value={businessForm.nit}
                onChange={(e) => setBusinessForm({ ...businessForm, nit: e.target.value })}
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <Button type="submit" loading={saving} className="flex items-center gap-2">
                <Save size={16} />
                Guardar Datos de la Empresa
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* PESTAÑA 2: REGLAS DE PRECIOS & DESCUENTOS */}
      {activeTab === 'precios' && (
        <Card className="max-w-2xl space-y-6">
          <form onSubmit={handleSavePricing} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-2">
                <PercentIcon size={18} className="text-emerald-400" />
                Markups y Límites de Descuento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Markup Global por Defecto (%)"
                  type="number"
                  placeholder="40"
                  value={pricingForm.markup_global_defecto}
                  onChange={(e) => setPricingForm({ ...pricingForm, markup_global_defecto: Number(e.target.value) })}
                />

                <Input
                  label="Descuento Máximo para Vendedores (%) *"
                  type="number"
                  placeholder="15"
                  value={pricingForm.descuento_maximo_vendedor}
                  onChange={(e) => setPricingForm({ ...pricingForm, descuento_maximo_vendedor: Number(e.target.value) })}
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                ℹ️ Los vendedores no podrán aplicar un descuento superior a este límite en la pantalla de ventas (POS).
              </span>
            </div>

            {/* Tabla de Markups Específicos por Categoría */}
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Markups Específicos por Categoría (%)
              </h4>
              <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-900 text-gray-400 text-[10px] uppercase font-semibold">
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-right">Markup Sugerido (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {Object.keys(pricingForm.markup_por_categoria).map((catKey) => (
                      <tr key={catKey}>
                        <td className="p-2.5 font-bold uppercase text-gray-200">{catKey}</td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            className="w-20 text-right bg-gray-900 border border-gray-700 rounded px-2 py-1 font-bold text-emerald-400 focus:ring-rose-500"
                            value={pricingForm.markup_por_categoria[catKey]}
                            onChange={(e) => {
                              const newCategories = {
                                ...pricingForm.markup_por_categoria,
                                [catKey]: Number(e.target.value),
                              }
                              setPricingForm({ ...pricingForm, markup_por_categoria: newCategories })
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <Button type="submit" loading={saving} className="flex items-center gap-2">
                <Save size={16} />
                Guardar Reglas de Precios
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* PESTAÑA 3: EXPORTAR / IMPORTAR DATOS (EXCEL) */}
      {activeTab === 'datos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sección Exportación */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Download size={18} className="text-rose-400" />
              Exportar Datos a Excel (.xlsx)
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Inventario Completo</h4>
                  <p className="text-[11px] text-gray-400">Descarga todos los repuestos con precios y stock.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => exportInventoryToExcel(products)}>
                  Descargar Excel
                </Button>
              </div>

              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Historial de Ventas</h4>
                  <p className="text-[11px] text-gray-400">Exporta las transacciones procesadas.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => exportSalesToExcel(salesHistory)}>
                  Descargar Excel
                </Button>
              </div>

              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Lista de Vendedores</h4>
                  <p className="text-[11px] text-gray-400">Directorio de cuentas registradas.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => exportSellersToExcel(vendedores)}>
                  Descargar Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* Sección Importación Masiva */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 border-b border-gray-800 pb-2">
              <Upload size={18} className="text-emerald-400" />
              Importación Masiva desde Excel / CSV
            </h3>

            <p className="text-xs text-gray-400">
              Sube una planilla de cálculo (.xlsx o .csv) para cargar o actualizar repuestos de forma masiva en el inventario.
            </p>

            <div className="p-4 border-2 border-dashed border-gray-800 rounded-xl text-center space-y-3 bg-gray-950">
              <FileSpreadsheet size={36} className="mx-auto text-emerald-400 opacity-60" />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors">
                  <Upload size={16} />
                  <span>Seleccionar Archivo Excel/CSV</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-gray-500">
                Columnas soportadas: Nombre, Código/SKU, Marca, Categoría, Unidad, Costo, Venta, Stock
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Vista Previa Importación */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Vista Previa de Importación Masiva (Excel/CSV)"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs flex justify-between items-center">
            <span>Se leyeron <strong className="text-emerald-400">{parsedPreview.length}</strong> productos del archivo.</span>
            <span className="text-gray-400">Puedes editar o desmarcar filas antes de confirmar.</span>
          </div>

          <div className="border border-gray-800 rounded-xl overflow-x-auto max-h-80 bg-gray-950">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-[10px] uppercase font-semibold">
                  <th className="p-2">Inc.</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Marca</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2 text-right">Costo (Bs.)</th>
                  <th className="p-2 text-right">Venta Sug. (Bs.)</th>
                  <th className="p-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {parsedPreview.map((item, idx) => (
                  <tr key={idx} className={item.incluir ? 'hover:bg-gray-900/60' : 'opacity-40'}>
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={item.incluir}
                        onChange={(e) => {
                          const updated = [...parsedPreview]
                          updated[idx].incluir = e.target.checked
                          setParsedPreview(updated)
                        }}
                      />
                    </td>
                    <td className="p-2 font-bold text-gray-200">{item.nombre}</td>
                    <td className="p-2 text-gray-400">{item.marca}</td>
                    <td className="p-2 uppercase text-rose-400 font-semibold">{item.categoria_sugerida}</td>
                    <td className="p-2 text-right font-mono">{formatBs(item.precio_costo)}</td>
                    <td className="p-2 text-right font-mono text-emerald-400 font-bold">{formatBs(item.precio_venta_sugerido)}</td>
                    <td className="p-2 text-right font-mono">{item.stock_inicial} un.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={importLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport} loading={importLoading} className="flex items-center gap-2">
              <CheckCircle size={16} />
              Confirmar e Importar {parsedPreview.filter((p) => p.incluir).length} Repuestos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
