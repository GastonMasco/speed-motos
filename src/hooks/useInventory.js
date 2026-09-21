import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { compressToWebP } from '../services/imageOptimizer'
import { ITEMS_PER_PAGE } from '../utils/constants'
import { useDebounce } from './useDebounce'

export const useInventory = (initialPage = 1) => {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filtros
  const [page, setPage] = useState(initialPage)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')

  // Cargar proveedores
  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true })

      if (!error && data) {
        setSuppliers(data)
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err)
    }
  }, [])

  // Cargar lista de marcas y categorías únicas
  const fetchFilterMetadata = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('categoria, marca')

      if (!error && data) {
        const uniqueCats = Array.from(new Set(data.map(p => p.categoria).filter(Boolean))).sort()
        const uniqueBrands = Array.from(new Set(data.map(p => p.marca).filter(Boolean))).sort()
        setCategories(uniqueCats)
        setBrands(uniqueBrands)
      }
    } catch (err) {
      console.error('Error cargando marcas/categorías:', err)
    }
  }, [])

  // Cargar productos paginados desde Supabase
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('productos')
        .select('*, proveedores(id, nombre)', { count: 'exact' })
        .order('nombre', { ascending: true })
        .range(from, to)

      // Filtro por texto de búsqueda (nombre, código proveedor, sku, marca, o compatibilidad)
      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`
        query = query.or(
          `nombre.ilike.${term},codigo_proveedor.ilike.${term},sku_interno.ilike.${term},marca.ilike.${term}`
        )
      }

      // Filtro por categoría
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('categoria', categoryFilter)
      }

      // Filtro por marca
      if (brandFilter && brandFilter !== 'all') {
        query = query.eq('marca', brandFilter)
      }

      // Filtro por proveedor
      if (supplierFilter && supplierFilter !== 'all') {
        query = query.eq('proveedor_id', supplierFilter)
      }

      const { data, count, error } = await query

      if (error) {
        console.warn('Error al cargar productos de Supabase:', error.message)
        setProducts([])
        setTotalCount(0)
      } else {
        setProducts(data || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Excepción cargando productos:', err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, categoryFilter, brandFilter, supplierFilter])

  useEffect(() => {
    fetchSuppliers()
    fetchFilterMetadata()
  }, [fetchSuppliers, fetchFilterMetadata])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Subir imagen WebP a Supabase Storage
  const uploadImage = async (file) => {
    if (!file) return null
    try {
      const webpFile = await compressToWebP(file)
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, webpFile, { contentType: 'image/webp', upsert: true })

      if (uploadError) {
        console.warn('Fallback imagen local/Storage:', uploadError.message)
        return null
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filePath)
      return data?.publicUrl || null
    } catch (err) {
      console.error('Error optimizando/subiendo imagen:', err)
      return null
    }
  }

  // Guardar (crear o actualizar) producto
  const saveProduct = async (productData, imageFile, currentUserId = null) => {
    let imageUrl = productData.image_url || null

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile)
      if (uploadedUrl) imageUrl = uploadedUrl
    }

    const payload = {
      sku_interno: productData.sku_interno || undefined,
      codigo_proveedor: productData.codigo_proveedor || '',
      proveedor_id: productData.proveedor_id || null,
      marca: productData.marca || 'GENERICO',
      nombre: productData.nombre,
      compatibilidad: Array.isArray(productData.compatibilidad)
        ? productData.compatibilidad
        : (productData.compatibilidad || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
      categoria: productData.categoria || 'general',
      unidad: productData.unidad || 'PZA',
      precio_costo: Number(productData.precio_costo) || 0,
      precio_venta: Number(productData.precio_venta) || 0,
      stock: Number(productData.stock) || 0,
      stock_minimo: Number(productData.stock_minimo) || 5,
      estado: productData.estado || 'activo',
      image_url: imageUrl,
    }

    if (productData.id) {
      // Obtener producto previo para comparar cambio de stock
      const oldProduct = products.find(p => p.id === productData.id)
      const oldStock = oldProduct ? oldProduct.stock : payload.stock

      const { data, error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id', productData.id)
        .select()

      if (error) throw error

      // Si cambió el stock, registrar un movimiento de tipo 'ajuste'
      if (oldProduct && oldStock !== payload.stock) {
        const diff = payload.stock - oldStock
        await supabase.from('movimientos_inventario').insert([
          {
            producto_id: productData.id,
            tipo: 'ajuste',
            cantidad: diff,
            motivo: `Ajuste manual de stock (${oldStock} ➔ ${payload.stock})`,
            usuario_id: currentUserId,
          }
        ])
      }

      await fetchProducts()
      await fetchFilterMetadata()
      return data
    } else {
      // Inserción de nuevo producto
      const { data, error } = await supabase
        .from('productos')
        .insert([payload])
        .select()

      if (error) throw error

      const newProd = data?.[0]
      if (newProd && payload.stock > 0) {
        // Registrar movimiento inicial de inventario
        await supabase.from('movimientos_inventario').insert([
          {
            producto_id: newProd.id,
            tipo: 'entrada',
            cantidad: payload.stock,
            motivo: 'Stock Inicial',
            usuario_id: currentUserId,
          }
        ])
      }

      await fetchProducts()
      await fetchFilterMetadata()
      return data
    }
  }

  // Eliminar producto
  const deleteProduct = async (id) => {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    await fetchProducts()
    await fetchFilterMetadata()
  }

  // Ajuste masivo de precios (% de incremento o descuento por categoría o marca)
  const bulkAdjustPrices = async ({ filterType, targetValue, percentage }) => {
    if (!targetValue || !percentage || isNaN(percentage)) {
      throw new Error('Debe especificar un objetivo y un porcentaje válido.')
    }

    const factor = 1 + (Number(percentage) / 100)

    // Obtener los productos que coincidan con la categoría o marca
    let selectQuery = supabase.from('productos').select('id, precio_venta')
    if (filterType === 'categoria') {
      selectQuery = selectQuery.eq('categoria', targetValue)
    } else {
      selectQuery = selectQuery.eq('marca', targetValue)
    }

    const { data: matchedProducts, error: selectErr } = await selectQuery
    if (selectErr) throw selectErr

    if (!matchedProducts || matchedProducts.length === 0) {
      throw new Error('No se encontraron productos que coincidan con los criterios.')
    }

    // Actualizar cada producto
    const updatePromises = matchedProducts.map(prod => {
      const newPrice = Math.round(Number(prod.precio_venta) * factor * 100) / 100
      return supabase
        .from('productos')
        .update({ precio_venta: newPrice })
        .eq('id', prod.id)
    })

    await Promise.all(updatePromises)
    await fetchProducts()
    return matchedProducts.length
  }

  // Obtener el historial de movimientos de un producto
  const fetchProductMovements = async (productId) => {
    if (!productId) return []
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*')
      .eq('producto_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1

  return {
    products,
    suppliers,
    categories,
    brands,
    loading,
    page,
    setPage,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    supplierFilter,
    setSupplierFilter,
    totalCount,
    totalPages,
    refreshProducts: fetchProducts,
    saveProduct,
    deleteProduct,
    bulkAdjustPrices,
    fetchProductMovements,
  }
}
