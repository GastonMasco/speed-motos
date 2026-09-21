import { useState } from 'react'
import { FileText, Upload, Sparkles, CheckCircle, AlertTriangle, Save, Trash2 } from 'lucide-react'
import { extractProductsFromPdf } from '../../services/pdfParser'
import { useInventory } from '../../hooks/useInventory'
import { formatBs } from '../../utils/formatters'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function PdfScannerPage() {
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [extractedProducts, setExtractedProducts] = useState([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { saveProduct, categories } = useInventory()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      setSuccessMessage('')
    }
  }

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setError('')
    setSuccessMessage('')

    try {
      const items = await extractProductsFromPdf(file)
      setExtractedProducts(items)
      setSuccessMessage(`¡Inteligencia Artificial Gemini extrajo ${items.length} productos del archivo!`)
    } catch (err) {
      setError(err.message || 'Error al analizar el PDF con Gemini AI.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUpdateItem = (index, field, value) => {
    const updated = [...extractedProducts]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setExtractedProducts(updated)
  }

  const handleRemoveItem = (index) => {
    setExtractedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBatchImport = async () => {
    if (extractedProducts.length === 0) return
    setImporting(true)
    setError('')

    try {
      const categoryId = categories[0]?.id || null
      for (const item of extractedProducts) {
        await saveProduct(
          {
            code: item.code || '',
            name: item.name,
            description: item.description || 'Importado desde PDF vía Gemini AI',
            price_bs: Number(item.price_bs) || 0,
            cost_bs: Number(item.cost_bs) || 0,
            stock: Number(item.stock) || 1,
            category_id: categoryId,
          },
          null
        )
      }
      setSuccessMessage(`¡Se han importado ${extractedProducts.length} productos al inventario exitosamente!`)
      setExtractedProducts([])
      setFile(null)
    } catch (err) {
      setError('Error al guardar en el inventario: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Sparkles className="text-rose-500 animate-pulse" />
          Lector IA de PDFs de Facturas (Gemini API)
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Carga un archivo PDF o foto de factura de tu proveedor para extraer repuestos e ingresarlos al inventario automáticamente.
        </p>
      </div>

      {/* Zona de Carga de Archivo */}
      <Card className="text-center py-8 px-4 border-dashed border-2 border-gray-800 hover:border-rose-500/40 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
          <FileText size={32} />
        </div>
        <h3 className="font-semibold text-sm text-gray-200">
          {file ? file.name : 'Selecciona o arrastra una factura en PDF o Imagen'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Soporta formatos PDF, JPG, PNG de catálogos y notas de venta de repuestos.
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors">
            <Upload size={16} />
            <span>{file ? 'Cambiar Archivo' : 'Buscar Archivo'}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <Button
              onClick={handleAnalyze}
              loading={analyzing}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700"
            >
              <Sparkles size={16} />
              Procesar con IA Gemini
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Resultados Extraídos */}
      {extractedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              Productos Detectados por IA ({extractedProducts.length})
            </h3>

            <Button
              onClick={handleBatchImport}
              loading={importing}
              variant="success"
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Importar Todos al Inventario
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre del Repuesto</th>
                  <th className="p-3">Costo (Bs.)</th>
                  <th className="p-3">Precio Venta (Bs.)</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {extractedProducts.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-850">
                    <td className="p-3">
                      <input
                        type="text"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 font-mono w-24"
                        value={item.code || ''}
                        onChange={(e) => handleUpdateItem(index, 'code', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 w-full min-w-[200px]"
                        value={item.name || ''}
                        onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.5"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 w-20"
                        value={item.cost_bs ?? 0}
                        onChange={(e) => handleUpdateItem(index, 'cost_bs', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.5"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-emerald-400 font-bold w-20"
                        value={item.price_bs ?? 0}
                        onChange={(e) => handleUpdateItem(index, 'price_bs', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 w-16"
                        value={item.stock ?? 1}
                        onChange={(e) => handleUpdateItem(index, 'stock', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                        title="Quitar ítem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
