import { useState } from 'react'
import { Plus, Search, Filter, AlertTriangle, Edit, Trash2, Package, TrendingUp, History, Tag, Wrench, Building2 } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { formatBs } from '../../utils/formatters'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Pagination } from '../../components/common/Pagination'
import { LazyImage } from '../../components/common/LazyImage'
import { ProductModal } from './ProductModal'
import { BulkPriceModal } from './BulkPriceModal'
import { ProductHistoryModal } from './ProductHistoryModal'
import { useAuth } from '../../context/AuthContext'

export default function InventoryPage() {
  const {
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
    saveProduct,
    deleteProduct,
    bulkAdjustPrices,
    fetchProductMovements,
  } = useInventory()

  const { isAdmin, user } = useAuth()

  // Estados de Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleOpenCreate = () => {
    setSelectedProduct(null)
    setIsProductModalOpen(true)
  }

  const handleOpenEdit = (product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleOpenHistory = (product) => {
    setHistoryProduct(product)
    setIsHistoryModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este repuesto del inventario?')) {
      setDeletingId(id)
      try {
        await deleteProduct(id)
      } catch (err) {
        alert('Error al eliminar: ' + err.message)
      } finally {
        setDeletingId(null)
      }
    }
  }

  // Opciones de Filtros
  const categoryOptions = [
    { value: 'all', label: 'Todas las Categorías' },
    ...categories.map(c => ({ value: c, label: c.toUpperCase() }))
  ]

  const brandOptions = [
    { value: 'all', label: 'Todas las Marcas' },
    ...brands.map(b => ({ value: b, label: b }))
  ]

  const supplierOptions = [
    { value: 'all', label: 'Todos los Proveedores' },
    ...suppliers.map(s => ({ value: s.id, label: s.nombre }))
  ]

  // Cálculo de Margen de Ganancia para Admin
  const calculateMargin = (cost, price) => {
    const numCost = Number(cost) || 0
    const numPrice = Number(price) || 0
    if (numCost <= 0) return null
    const margin = ((numPrice - numCost) / numCost) * 100
    return margin.toFixed(1)
  }

  return (
    <div className="space-y-6 relative pb-16">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Package className="text-rose-500" />
            Catálogo de Repuestos e Inventario
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestión completa de stock, proveedores, compatibilidad y control de precios
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-2 text-xs"
            >
              <TrendingUp size={16} />
              Ajuste Masivo Precios
            </Button>
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 text-xs"
            >
              <Plus size={16} />
              Nuevo Repuesto
            </Button>
          </div>
        )}
      </div>

      {/* Buscador y Filtros Avanzados */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Input
            icon={Search}
            placeholder="Buscar repuesto, código o moto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <Select
            icon={Filter}
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <Select
            icon={Wrench}
            options={brandOptions}
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div>
          <Select
            icon={Building2}
            options={supplierOptions}
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </Card>

      {/* Grid de Productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-900 border border-gray-800 rounded-xl"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-600 mb-3" />
          <h3 className="text-sm font-semibold text-gray-300">No se encontraron repuestos</h3>
          <p className="text-xs text-gray-500 mt-1">Intenta ajustando los términos de búsqueda o filtros.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((item) => {
            const isLowStock = item.stock <= (item.stock_minimo ?? 5)
            const marginPct = isAdmin ? calculateMargin(item.precio_costo, item.precio_venta) : null
            const compatList = Array.isArray(item.compatibilidad) ? item.compatibilidad : []

            return (
              <Card key={item.id} className="flex flex-col justify-between group relative overflow-hidden">
                <div>
                  {/* Encabezado Tarjeta / Imagen */}
                  <div className="relative mb-3 rounded-lg overflow-hidden h-36 bg-gray-900 border border-gray-800">
                    <LazyImage
                      src={item.image_url}
                      alt={item.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <span className="absolute top-2 left-2 bg-gray-950/80 backdrop-blur-xs text-gray-300 font-mono text-[10px] px-2 py-0.5 rounded border border-gray-800">
                      {item.sku_interno || item.codigo_proveedor || 'S/SKU'}
                    </span>

                    {isLowStock && (
                      <Badge variant="warning" className="absolute top-2 right-2 flex items-center gap-1">
                        <AlertTriangle size={10} /> Stock Bajo ({item.stock})
                      </Badge>
                    )}
                  </div>

                  {/* Marca y Categoría */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      {item.categoria || 'General'}
                    </span>
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-medium">
                      {item.marca || 'Genérico'}
                    </span>
                  </div>

                  {/* Nombre de Producto */}
                  <h3 className="font-semibold text-sm text-gray-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {item.nombre}
                  </h3>

                  {/* Compatibilidad de Motos */}
                  {compatList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {compatList.slice(0, 3).map((moto, i) => (
                        <span key={i} className="text-[9px] bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700/50">
                          🏍️ {moto}
                        </span>
                      ))}
                      {compatList.length > 3 && (
                        <span className="text-[9px] text-gray-500">+{compatList.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sección de Precios y Stock */}
                <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Precio Venta:</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {formatBs(item.precio_venta ?? item.price_bs)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Stock ({item.unidad || 'PZA'}):</span>
                      <span className={`text-xs font-bold ${isLowStock ? 'text-amber-400' : 'text-gray-200'}`}>
                        {item.stock} un.
                      </span>
                    </div>
                  </div>

                  {/* Vista exclusiva para Admin: Costo y Margen */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-gray-800/50 flex items-center justify-between text-[11px] bg-gray-900/50 p-1.5 rounded-lg">
                      <div>
                        <span className="text-gray-400">Costo: </span>
                        <span className="font-mono text-gray-300">{formatBs(item.precio_costo ?? item.cost_bs)}</span>
                      </div>
                      {marginPct && (
                        <div className="text-right">
                          <span className="text-gray-400">Margen: </span>
                          <span className={`font-bold ${Number(marginPct) >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            +{marginPct}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Acciones para Admin */}
                  {isAdmin && (
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-800/60">
                      <button
                        onClick={() => handleOpenHistory(item)}
                        className="text-[11px] text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                        title="Ver historial de movimientos"
                      >
                        <History size={13} />
                        <span>Historial</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5"
                          title="Editar Repuesto"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          loading={deletingId === item.id}
                          className="p-1.5"
                          title="Eliminar Repuesto"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        onPageChange={setPage}
      />

      {/* Botón flotante para Admin */}
      {isAdmin && (
        <button
          onClick={handleOpenCreate}
          className="fixed bottom-6 right-6 w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
          title="Agregar Producto Nuevo"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Modales */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        suppliers={suppliers}
        categories={categories}
        onSave={saveProduct}
        currentUserId={user?.id}
      />

      {isAdmin && (
        <BulkPriceModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          categories={categories}
          brands={brands}
          onApply={bulkAdjustPrices}
        />
      )}

      <ProductHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        product={historyProduct}
        fetchMovements={fetchProductMovements}
      />
    </div>
  )
}
