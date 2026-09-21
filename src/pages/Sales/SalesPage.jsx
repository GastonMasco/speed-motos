import { useState } from 'react'
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, User, FileText, Phone, Tag, Percent, AlertCircle, ShoppingBag } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { useSales } from '../../hooks/useSales'
import { formatBs } from '../../utils/formatters'
import { PAYMENT_METHODS } from '../../utils/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import { LazyImage } from '../../components/common/LazyImage'
import { QuantityModal } from './QuantityModal'
import { ReceiptModal } from './ReceiptModal'

import { useBusinessConfig } from '../../hooks/useBusinessConfig'
import { useAuth } from '../../context/AuthContext'

export default function SalesPage() {
  const { config } = useBusinessConfig()
  const { isAdmin } = useAuth()
  const { products, search, setSearch, loading: invLoading } = useInventory()
  const {
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
    loading: saleLoading,
  } = useSales()

  // Modal para seleccionar cantidad
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false)

  // Datos del Cliente y Pago
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNit, setClientNit] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  // Modal de Comprobante
  const [completedSaleData, setCompletedSaleData] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false)

  const handleProductClick = (product) => {
    if (product.stock <= 0) return
    setSelectedProduct(product)
    setIsQuantityModalOpen(true)
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    setError('')

    try {
      const sale = await completeSale({
        clientName: clientName.trim() || 'Cliente Ocasional',
        clientPhone: clientPhone.trim(),
        clientNit: clientNit.trim(),
        paymentMethod,
      })

      setCompletedSaleData(sale)
      setIsReceiptModalOpen(true)
      setIsCartMobileOpen(false)

      // Limpiar formulario cliente
      setClientName('')
      setClientPhone('')
      setClientNit('')
    } catch (err) {
      setError(err.message || 'Error al procesar la venta.')
    }
  }

  return (
    <div className="space-y-6 relative pb-20 md:pb-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <ShoppingCart className="text-rose-500" />
            Punto de Venta (POS)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Cobro rápido de repuestos, verificación de stock e impresión de comprobantes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catálogo de Productos para agregar */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <Input
              icon={Search}
              placeholder="Buscar repuesto por nombre, código o moto (ej. CRF230)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Card>

          {invLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-gray-900 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="text-center py-12 text-gray-500 text-xs">
              No se encontraron repuestos con los criterios de búsqueda.
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
              {products.map((product) => {
                const outOfStock = product.stock <= 0
                const price = Number(product.precio_venta ?? product.price_bs ?? 0)
                const compatList = Array.isArray(product.compatibilidad) ? product.compatibilidad : []

                return (
                  <button
                    key={product.id}
                    disabled={outOfStock}
                    onClick={() => handleProductClick(product)}
                    className={`
                      text-left p-3 rounded-xl border bg-gray-900 border-gray-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group active:scale-95
                      ${outOfStock ? 'opacity-40 cursor-not-allowed bg-gray-950/50' : 'cursor-pointer hover:bg-gray-850'}
                    `}
                  >
                    <div>
                      <div className="h-24 rounded-lg overflow-hidden mb-2 bg-gray-950 relative border border-gray-800">
                        <LazyImage src={product.image_url} alt={product.nombre || product.name} />
                        {product.marca && (
                          <span className="absolute top-1 right-1 bg-gray-950/80 backdrop-blur-xs text-[9px] text-gray-300 font-semibold px-1.5 py-0.5 rounded border border-gray-800">
                            {product.marca}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-rose-400 font-mono font-semibold block">
                        {product.sku_interno || product.codigo_proveedor || product.code}
                      </span>
                      
                      <h4 className="text-xs font-semibold text-gray-100 line-clamp-2 group-hover:text-rose-400 transition-colors">
                        {product.nombre || product.name}
                      </h4>

                      {compatList.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {compatList.slice(0, 2).map((m, i) => (
                            <span key={i} className="text-[9px] text-gray-400 bg-gray-800 px-1 py-0.2 rounded">
                              🏍️ {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-800/60 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">
                        {formatBs(price)}
                      </span>
                      <span className={`text-[10px] font-bold ${outOfStock ? 'text-rose-400' : 'text-gray-400'}`}>
                        {outOfStock ? 'Sin Stock' : `${product.stock} un.`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Sección Carrito de Compras (Desktop & Drawer) */}
        <div className={`
          lg:col-span-5
          ${isCartMobileOpen ? 'fixed inset-0 z-50 bg-gray-950/95 p-4 overflow-y-auto block' : 'hidden lg:block'}
        `}>
          <Card className="sticky top-20 flex flex-col justify-between h-full border-rose-900/40">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="font-bold text-sm text-gray-100 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-rose-500" />
                  Carrito de Venta ({cart.reduce((s, i) => s + i.quantity, 0)} ítems)
                </h3>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={13} /> Vaciar
                    </button>
                  )}
                  {isCartMobileOpen && (
                    <button
                      onClick={() => setIsCartMobileOpen(false)}
                      className="lg:hidden text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded"
                    >
                      Cerrar ✕
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Lista de ítems en carrito */}
              <div className="divide-y divide-gray-800/80 max-h-[260px] overflow-y-auto my-3 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    <ShoppingBag size={36} className="mx-auto mb-2 opacity-50 text-rose-500" />
                    El carrito está vacío.<br />Selecciona los repuestos de la izquierda para agregarlos.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-gray-100 truncate">
                          {item.product.nombre || item.product.name}
                        </h5>
                        <span className="text-[11px] text-emerald-400 font-mono block">
                          {formatBs(item.unitPrice)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-extrabold text-gray-100 font-mono">
                          {formatBs(item.subtotalLine)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-500 hover:text-rose-400 p-1"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Formulario Datos de Cliente y Confirmación */}
            <form onSubmit={handleCheckout} className="pt-3 border-t border-gray-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  label="Cliente *"
                  icon={User}
                  placeholder="Pedro Ramos"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
                <Input
                  label="Teléfono"
                  icon={Phone}
                  placeholder="71234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
                <Input
                  label="NIT / CI"
                  icon={FileText}
                  placeholder="Sin NIT"
                  value={clientNit}
                  onChange={(e) => setClientNit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Método de Pago"
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />

                <Input
                  label={`Descuento (%) [Max ${config.descuento_maximo_vendedor}%]`}
                  type="number"
                  min="0"
                  max="100"
                  icon={Percent}
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    const maxAllowed = Number(config.descuento_maximo_vendedor) || 15
                    if (!isAdmin && val > maxAllowed) {
                      alert(`El límite máximo de descuento permitido para vendedores es ${maxAllowed}%.`)
                      setDiscountPercent(maxAllowed)
                    } else {
                      setDiscountPercent(val)
                    }
                  }}
                />
              </div>

              {/* Resumen de totales */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-1">
                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatBs(subtotalCart)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-400">
                      <span>Descuento ({discountPercent}%):</span>
                      <span className="font-mono">-{formatBs(discountAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-sm font-extrabold text-gray-100 pt-1">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-xl text-emerald-400 font-mono">{formatBs(cartTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={cart.length === 0}
                loading={saleLoading}
                className="py-3 text-sm font-bold shadow-xl shadow-rose-900/30 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Confirmar Venta ({formatBs(cartTotal)})
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Botón flotante para móvil (Abrir Carrito) */}
      {cart.length > 0 && !isCartMobileOpen && (
        <button
          onClick={() => setIsCartMobileOpen(true)}
          className="lg:hidden fixed bottom-20 right-6 z-40 bg-rose-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-bounce"
        >
          <ShoppingCart size={22} />
          <span className="bg-white text-rose-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
          <span className="text-sm font-mono">{formatBs(cartTotal)}</span>
        </button>
      )}

      {/* Modales */}
      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => setIsQuantityModalOpen(false)}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSaleData}
      />
    </div>
  )
}
