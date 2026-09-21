/**
 * Exporta la lista de productos (Inventario) a un archivo Excel (.xlsx)
 */
export const exportInventoryToExcel = async (products = [], fileName = 'Inventario_SpeedRaoMotos.xlsx') => {
  const XLSX = await import('xlsx')
  const data = products.map((p) => ({
    'SKU Interno': p.sku_interno || p.code || '',
    'Código Proveedor': p.codigo_proveedor || '',
    'Nombre del Repuesto': p.nombre || p.name || '',
    'Marca': p.marca || 'GENERICO',
    'Categoría': (p.categoria || p.categories?.name || 'varios').toUpperCase(),
    'Compatibilidad': Array.isArray(p.compatibilidad) ? p.compatibilidad.join(', ') : p.compatibilidad || '',
    'Unidad': p.unidad || 'PZA',
    'Precio Costo (Bs.)': Number(p.precio_costo ?? p.cost_bs ?? 0),
    'Precio Venta (Bs.)': Number(p.precio_venta ?? p.price_bs ?? 0),
    'Stock Actual': Number(p.stock || 0),
    'Stock Mínimo': Number(p.stock_minimo ?? p.min_stock ?? 5),
    'Estado': (p.estado || 'activo').toUpperCase(),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')
  XLSX.writeFile(workbook, fileName)
}

/**
 * Exporta el historial de ventas a un archivo Excel (.xlsx)
 */
export const exportSalesToExcel = async (sales = [], fileName = 'Ventas_SpeedRaoMotos.xlsx') => {
  const XLSX = await import('xlsx')
  const data = sales.map((s) => ({
    'N° Venta': s.numero_venta || `VEN-${s.id.substring(0, 6).toUpperCase()}`,
    'Fecha / Hora': s.created_at ? new Date(s.created_at).toLocaleString('es-BO') : '',
    'Vendedor': s.profiles?.nombre_completo || s.profiles?.full_name || 'Desconocido',
    'Cliente': s.cliente_nombre || s.client_name || 'Cliente Ocasional',
    'Teléfono Cliente': s.cliente_telefono || s.client_phone || '',
    'NIT / CI': s.cliente_nit || s.client_ci_nit || 'Sin NIT',
    'Método Pago': (s.metodo_pago || s.payment_method || 'efectivo').toUpperCase(),
    'Subtotal (Bs.)': Number(s.subtotal ?? s.total_bs ?? 0),
    'Descuento (Bs.)': Number(s.descuento ?? 0),
    'Total Cancelado (Bs.)': Number(s.total ?? s.total_bs ?? 0),
    'Estado': (s.estado || 'completada').toUpperCase(),
    'Motivo Anulación': s.motivo_anulacion || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas')
  XLSX.writeFile(workbook, fileName)
}

/**
 * Exporta lista de vendedores a Excel (.xlsx)
 */
export const exportSellersToExcel = async (vendedores = [], fileName = 'Vendedores_SpeedRaoMotos.xlsx') => {
  const XLSX = await import('xlsx')
  const data = vendedores.map((v) => ({
    'Nombre Completo': v.nombre_completo || '',
    'Correo Electrónico': v.email || '',
    'Teléfono': v.telefono || '',
    'Rol': (v.rol || 'vendedor').toUpperCase(),
    'Estado Cuenta': (v.estado || 'pendiente').toUpperCase(),
    'Fecha Registro': v.created_at ? new Date(v.created_at).toLocaleDateString('es-BO') : '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendedores')
  XLSX.writeFile(workbook, fileName)
}

/**
 * Lee y parsea un archivo CSV o Excel (.xlsx, .xls) subido por el usuario
 * Devuelve un arreglo de objetos normalizados para previsualizar antes de importar
 */
export const parseExcelOrCsvFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No se ha seleccionado ningún archivo.'))

    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx')
        const buffer = e.target.result
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        if (!rawJson || rawJson.length === 0) {
          throw new Error('El archivo no contiene filas de datos.')
        }

        // Mapear encabezados comunes flexibles
        const parsedProducts = rawJson.map((row, idx) => {
          const findVal = (keys) => {
            const foundKey = Object.keys(row).find((k) =>
              keys.some((key) => k.toLowerCase().trim().includes(key.toLowerCase()))
            )
            return foundKey ? row[foundKey] : ''
          }

          const nombre = String(findVal(['nombre', 'producto', 'repuesto', 'descripcion']) || `Repuesto #${idx + 1}`).trim()
          const codigo = String(findVal(['codigo', 'sku', 'cod'])).trim()
          const marca = String(findVal(['marca']) || 'GENERICO').trim()
          const categoria = String(findVal(['cat', 'categoria']) || 'varios').toLowerCase().trim()
          const unidad = String(findVal(['unidad', 'medida']) || 'PZA').toUpperCase().trim()
          const costo = Number(findVal(['costo', 'compra'])) || 0
          const venta = Number(findVal(['venta', 'precio'])) || Math.round(costo * 1.4 * 100) / 100
          const stock = Number(findVal(['stock', 'cantidad'])) || 5
          const compat = String(findVal(['compatibilidad', 'motos', 'modelos'])).split(',').map(s => s.trim()).filter(Boolean)

          return {
            id: `temp_${idx}_${Date.now()}`,
            codigo_proveedor: codigo,
            nombre,
            marca,
            categoria_sugerida: ['frenos','llantas','transmision','plasticos','filtros','lubricantes','electricidad','motor'].includes(categoria) ? categoria : 'varios',
            compatibilidad_sugerida: compat,
            unidad: ['PZA', 'PAR', 'JGO', 'KIT'].includes(unidad) ? unidad : 'PZA',
            precio_costo: costo,
            precio_venta_sugerido: venta,
            stock_inicial: stock,
            incluir: true,
          }
        })

        resolve(parsedProducts)
      } catch (err) {
        console.error('Error parseando hoja de cálculo:', err)
        reject(new Error('Formato de archivo no válido: ' + err.message))
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}
