import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { formatBs } from '../../utils/formatters'

export const QuantityModal = ({
  isOpen,
  onClose,
  product = null,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (product) {
      setQuantity(1)
    }
  }, [product, isOpen])

  if (!product) return null

  const maxStock = product.stock || 0
  const unitPrice = Number(product.precio_venta ?? product.price_bs ?? 0)
  const subtotal = quantity * unitPrice

  const handleIncrement = () => {
    if (quantity < maxStock) {
      setQuantity(prev => prev + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (quantity > 0 && quantity <= maxStock) {
      onAddToCart(product, quantity)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Producto a la Venta"
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
              {product.sku_interno || product.codigo_proveedor || product.code}
            </span>
            <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
              {product.marca || 'Genérico'}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-100">{product.nombre || product.name}</h4>
          <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
            <span className="text-gray-400">Precio Unitario:</span>
            <span className="font-extrabold text-emerald-400">{formatBs(unitPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Stock Disponible:</span>
            <span className={`font-bold ${maxStock <= 5 ? 'text-amber-400' : 'text-gray-200'}`}>
              {maxStock} unidades
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 text-center">
              Seleccionar Cantidad
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-200 hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Minus size={18} />
              </button>
              
              <input
                type="number"
                min="1"
                max={maxStock}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  if (val >= 1 && val <= maxStock) setQuantity(val)
                }}
                className="w-16 h-10 text-center bg-gray-950 border border-gray-800 rounded-xl text-base font-black text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= maxStock}
                className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-200 hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-gray-400">Subtotal Línea:</span>
            <span className="text-lg font-black text-emerald-400">{formatBs(subtotal)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth className="flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
