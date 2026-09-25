import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Wrench, FileText, AlertTriangle, Users, ArrowRight, DollarSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import { formatBs } from '../../utils/formatters'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    todaySalesBs: 0,
    salesCount: 0,
    lowStockCount: 0,
    repairsCount: 0,
    pendingSellersCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // 1. Ventas del día
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: salesData } = await supabase
          .from('sales')
          .select('total_bs')
          .gte('created_at', `${todayStr}T00:00:00.000Z`)

        const todayTotal = (salesData || []).reduce((sum, s) => sum + Number(s.total_bs || 0), 0)

        // 2. Repuestos con bajo stock
        const { count: lowStock } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .lte('stock', 5)

        // 3. Reparaciones activas
        const { count: activeRepairs } = await supabase
          .from('repairs')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'entregado')

        // 4. Vendedores pendientes (para admin)
        let pendingSellers = 0
        if (isAdmin) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
          pendingSellers = count || 0
        }

        setStats({
          todaySalesBs: todayTotal,
          salesCount: salesData?.length || 0,
          lowStockCount: lowStock || 0,
          repairsCount: activeRepairs || 0,
          pendingSellersCount: pendingSellers,
        })
      } catch (err) {
        console.warn('Error al cargar métricas de dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin])

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div className="bg-gradient-to-r from-rose-900/40 via-gray-900 to-gray-900 border border-rose-900/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <Badge variant={isAdmin ? 'danger' : 'info'} className="mb-2">
            {isAdmin ? 'Panel de Administración' : 'Panel de Vendedor'}
          </Badge>
          <h1 className="text-2xl font-black text-white">
            ¡Bienvenido, {profile?.full_name || 'Vendedor'}! 👋
          </h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            Gestión en tiempo real para <strong>Motos Service Oraqueni</strong> (La Paz, Bolivia). Sistema ligero y optimizado para red móvil.
          </p>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-5 border-emerald-900/30 bg-emerald-950/20">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Ventas de Hoy</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {loading ? '...' : formatBs(stats.todaySalesBs)}
            </span>
            <span className="text-[10px] text-gray-500 block">{stats.salesCount} transacción(es)</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5 border-amber-900/30 bg-amber-950/20">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Alertas Stock Bajo</span>
            <span className="text-xl font-extrabold text-amber-400">
              {loading ? '...' : stats.lowStockCount}
            </span>
            <span className="text-[10px] text-gray-500 block">Repuestos &le; 5 un.</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5 border-blue-900/30 bg-blue-950/20">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-medium">Reparaciones Activas</span>
            <span className="text-xl font-extrabold text-blue-400">
              {loading ? '...' : stats.repairsCount}
            </span>
            <span className="text-[10px] text-gray-500 block">Motos en taller</span>
          </div>
        </Card>

        {isAdmin ? (
          <Card className="flex items-center gap-4 p-5 border-rose-900/30 bg-rose-950/20">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">Vendedores Pendientes</span>
              <span className="text-xl font-extrabold text-rose-400">
                {loading ? '...' : stats.pendingSellersCount}
              </span>
              <span className="text-[10px] text-gray-500 block">Requieren aprobación</span>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center gap-4 p-5 border-purple-900/30 bg-purple-950/20">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <ShoppingCart size={24} />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">Punto de Venta</span>
              <span className="text-sm font-bold text-purple-300 block">Listo para cobrar</span>
              <span className="text-[10px] text-gray-500 block">Moneda Bolivianos</span>
            </div>
          </Card>
        )}
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Accesos Rápidos a Módulos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/ventas" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center mb-3">
                  <ShoppingCart size={20} />
                </div>
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-rose-400">
                  Cobro Rápido (POS)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Registra ventas directas de repuestos y emite resúmenes de pago.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>Ir al Punto de Venta</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/inventario" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-3">
                  <Package size={20} />
                </div>
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-amber-400">
                  Inventario de Repuestos
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Catálogo paginado con optimizador de imágenes WebP.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Ver Productos</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/reparaciones" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
                  <Wrench size={20} />
                </div>
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-blue-400">
                  Taller de Reparaciones
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Control de motos ingresadas, repuestos aplicados y saldos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                <span>Ver Órdenes</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/pdf-ai" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                  <FileText size={20} />
                </div>
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-purple-400">
                  Lector Facturas PDF (IA)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Importa listas de proveedores de forma automática con Gemini API.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-purple-400 font-semibold">
                <span>Escanear PDF</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
