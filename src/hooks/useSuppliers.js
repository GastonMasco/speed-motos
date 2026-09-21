import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { extractProductsFromPdf } from '../services/geminiPdfExtractor'

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [listsHistory, setListsHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // Cargar lista de proveedores
  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.warn('Error al cargar proveedores:', error.message)
        setSuppliers([])
      } else {
        setSuppliers(data || [])
      }
    } catch (err) {
      console.error('Excepción cargando proveedores:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar historial de listas subidas
  const fetchListsHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('listas_proveedor')
        .select('*, proveedores(nombre), items_extraidos(count)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setListsHistory(data)
      }
    } catch (err) {
      console.error('Error cargando listas de proveedores:', err)
    }
  }, [])

  useEffect(() => {
    fetchSuppliers()
    fetchListsHistory()
  }, [fetchSuppliers, fetchListsHistory])

  // Crear nuevo proveedor
  const createSupplier = async ({ nombre, telefono, notas }) => {
    if (!nombre || !nombre.trim()) throw new Error('El nombre del proveedor es obligatorio.')

    const { data, error } = await supabase
      .from('proveedores')
      .insert([{ nombre: nombre.trim(), telefono: telefono || '', notas: notas || '' }])
      .select()

    if (error) throw error
    await fetchSuppliers()
    return data
  }

  // Procesar archivo PDF con Gemini AI
  const processPdfPriceList = async ({ supplierId, pdfFile, fechaLista = '' }) => {
    if (!supplierId) throw new Error('Debes seleccionar un proveedor.')
    if (!pdfFile) throw new Error('Debes seleccionar un archivo PDF.')

    setLoading(true)
    let newListRecord = null

    try {
      // 1. Crear registro inicial en listas_proveedor (estado: 'procesando')
      const monthYearText = fechaLista || new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
      const { data: listData, error: listErr } = await supabase
        .from('listas_proveedor')
        .insert([
          {
            proveedor_id: supplierId,
            nombre_archivo: pdfFile.name,
            fecha_lista: monthYearText,
            estado: 'procesando',
          }
        ])
        .select()
        .single()

      if (listErr) throw listErr
      newListRecord = listData

      // 2. Extraer ítems con la Gemini API
      const rawExtracted = await extractProductsFromPdf(pdfFile)

      // 3. Formatear payload para guardar en items_extraidos
      const itemsPayload = rawExtracted.map((item) => {
        const isAgotado = item.estado_producto === 'agotado'
        return {
          lista_id: newListRecord.id,
          codigo_proveedor: item.codigo_proveedor || '',
          nombre: item.nombre,
          marca: item.marca || 'GENERICO',
          categoria_sugerida: item.categoria_sugerida || 'varios',
          compatibilidad_sugerida: Array.isArray(item.compatibilidad_sugerida) ? item.compatibilidad_sugerida : [],
          unidad: ['PZA', 'PAR', 'JGO', 'KIT'].includes(item.unidad) ? item.unidad : 'PZA',
          precio_costo: isAgotado ? null : Number(item.precio_costo) || 0,
          estado_producto: item.estado_producto || 'disponible',
          confianza_ia: item.confianza_ia || 'alta',
          incluir: !isAgotado, // Si está agotado, desmarcado por defecto
        }
      })

      const { error: itemsErr } = await supabase
        .from('items_extraidos')
        .insert(itemsPayload)

      if (itemsErr) throw itemsErr

      // 4. Actualizar estado a 'pendiente_revision'
      await supabase
        .from('listas_proveedor')
        .update({ estado: 'pendiente_revision' })
        .eq('id', newListRecord.id)

      await fetchListsHistory()
      return newListRecord.id
    } catch (err) {
      console.error('Error al procesar lista PDF:', err)
      if (newListRecord?.id) {
        await supabase.from('listas_proveedor').delete().eq('id', newListRecord.id)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cargar ítems extraídos de una lista específica para la pantalla de revisión
  const fetchExtractedItems = async (listId) => {
    if (!listId) return []
    const { data, error } = await supabase
      .from('items_extraidos')
      .select('*')
      .eq('lista_id', listId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Confirmar e importar la lista al inventario mediante RPC
  const confirmAndImportList = async (listId, items, currentUserId) => {
    if (!listId || !items || items.length === 0) {
      throw new Error('No hay ítems para importar.')
    }

    setLoading(true)
    try {
      const itemsPayload = items.map((it) => ({
        codigo_proveedor: it.codigo_proveedor || '',
        nombre: it.nombre,
        marca: it.marca || 'GENERICO',
        categoria: it.categoria_sugerida || 'varios',
        compatibilidad: Array.isArray(it.compatibilidad_sugerida) ? it.compatibilidad_sugerida : [],
        unidad: it.unidad || 'PZA',
        precio_costo: Number(it.precio_costo) || 0,
        precio_venta: Number(it.precio_venta_sugerido) || 0,
        incluir: Boolean(it.incluir),
        stock_inicial: Number(it.stock_inicial) || 5,
      }))

      const { data, error } = await supabase.rpc('confirmar_e_importar_lista', {
        p_lista_id: listId,
        p_items: itemsPayload,
        p_usuario_id: currentUserId,
      })

      if (error) throw new Error(error.message || 'Error importando la lista al inventario.')

      await fetchListsHistory()
      return data
    } catch (err) {
      console.error('Error confirmando e importando lista:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    suppliers,
    listsHistory,
    loading,
    refreshSuppliers: fetchSuppliers,
    refreshListsHistory: fetchListsHistory,
    createSupplier,
    processPdfPriceList,
    fetchExtractedItems,
    confirmAndImportList,
  }
}
