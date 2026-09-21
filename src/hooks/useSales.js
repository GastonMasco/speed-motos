import { useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'
import { ITEMS_PER_PAGE } from '../utils/constants'

export const useSales = () => {
  const { profile, isAdmin } = useAuth()
  const [cart, setCart] = useState([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [salesHistory, setSalesHistory] = useState([])
  const [historyTotalCount, setHistoryTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Agregar repuesto al carrito con cantidad
  const addToCart = (product, quantity = 1) => {
    if (!product || product.stock <= 0) return

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id)
      const unitPrice = Number(product.precio_venta ?? product.price_bs ?? 0)

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity
        const newQty = currentQty + quantity

        if (newQty > product.stock) {
          alert(`No hay suficiente stock. Stock máximo disponible: ${product.stock} unidades.`)
          return prevCart
        }

        const updated = [...prevCart]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotalLine: newQty * unitPrice,
        }
        return updated
      } else {
        const qty = Math.min(quantity, product.stock)
        return [
          ...prevCart,
          {
            product,
            quantity: qty,
            unitPrice,
            subtotalLine: qty * unitPrice,
          },
        ]
      }
    })
  }

  // Actualizar cantidad de un repuesto en el carrito
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.stock) {
            alert(`Stock disponible superado: ${item.product.stock} unidades.`)
            return item
          }
          return {
            ...item,
            quantity: newQuantity,
            subtotalLine: newQuantity * item.unitPrice,
          }
        }
        return item
      })
    })
  }

  // Eliminar producto del carrito
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  // Limpiar carrito
  const clearCart = () => {
    setCart([])
    setDiscountPercent(0)
  }

  // Totales del carrito
  const subtotalCart = cart.reduce((sum, item) => sum + item.subtotalLine, 0)
  const discountAmount = Math.round(subtotalCart * (Number(discountPercent) / 100) * 100) / 100
  const cartTotal = Math.max(0, subtotalCart - discountAmount)

  // Confirmar venta ejecutando la función atómica en Supabase
  const completeSale = async ({
    clientName = 'Cliente Ocasional',
    clientPhone = '',
    clientNit = '',
    paymentMethod = 'efectivo',
  }) => {
    if (cart.length === 0) throw new Error('El carrito está vacío.')

    setLoading(true)
    try {
      // Formatear payload de ítems para la función PostgreSQL
      const itemsPayload = cart.map((item) => ({
        producto_id: item.product.id,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        subtotal_linea: item.subtotalLine,
      }))

      // Invocar función RPC procesar_venta_atomic
      const { data: result, error: rpcError } = await supabase.rpc('procesar_venta_atomic', {
        p_vendedor_id: profile?.id || null,
        p_cliente_nombre: clientName.trim() || 'Cliente Ocasional',
        p_cliente_telefono: clientPhone.trim() || null,
        p_cliente_nit: clientNit.trim() || null,
        p_metodo_pago: paymentMethod,
        p_subtotal: subtotalCart,
        p_descuento: discountAmount,
        p_total: cartTotal,
        p_items: itemsPayload,
      })

      if (rpcError) {
        throw new Error(rpcError.message || 'Error en la base de datos al procesar la venta.')
      }

      const saleId = result?.id

      // Obtener registro completo con datos de la venta e ítems para el comprobante
      const { data: fullSale, error: fetchErr } = await supabase
        .from('ventas')
        .select('*, profiles(nombre_completo, email), venta_items(*, productos(nombre, sku_interno, marca))')
        .eq('id', saleId)
        .single()

      if (fetchErr) {
        console.warn('Venta procesada pero fallo al reconsultar detalle:', fetchErr.message)
      }

      clearCart()
      return fullSale || result
    } catch (err) {
      console.error('Error completando la venta:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Anular venta (Solo Admin) restituyendo stock atómicamente
  const anularVenta = async (saleId, motivo, currentUserId) => {
    if (!motivo || !motivo.trim()) {
      throw new Error('Debe especificar un motivo de anulación obligatorio.')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('anular_venta_atomic', {
        p_venta_id: saleId,
        p_motivo: motivo.trim(),
        p_usuario_id: currentUserId,
      })

      if (error) throw new Error(error.message || 'Error al anular la venta.')

      return data
    } catch (err) {
      console.error('Error al anular venta:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Cargar historial de ventas con filtros
  const fetchSalesHistory = useCallback(async ({
    page = 1,
    sellerId = 'all',
    startDate = '',
    endDate = '',
    paymentMethod = 'all',
    forcedSellerId = null,
  } = {}) => {
    setLoading(true)
    try {
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('ventas')
        .select('*, profiles(nombre_completo, email), venta_items(*, productos(nombre, sku_interno, marca, precio_costo))', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Si es rol VENDEDOR, forzar filtro por su vendedor_id
      if (forcedSellerId) {
        query = query.eq('vendedor_id', forcedSellerId)
      } else if (sellerId && sellerId !== 'all') {
        query = query.eq('vendedor_id', sellerId)
      }

      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('metodo_pago', paymentMethod)
      }

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`)
      }

      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`)
      }

      const { data, count, error } = await query

      if (error) {
        console.warn('Error al cargar historial de ventas de Supabase:', error.message)
        setSalesHistory([])
        setHistoryTotalCount(0)
      } else {
        setSalesHistory(data || [])
        setHistoryTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Excepción cargando ventas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    cart,
    subtotalCart,
    discountPercent,
    setDiscountPercent,
    discountAmount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    anularVenta,
    salesHistory,
    historyTotalCount,
    fetchSalesHistory,
    loading,
  }
}
