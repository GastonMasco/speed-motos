import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, Package, Truck, ArrowRight, ShieldCheck, DollarSign, Calendar, AlertTriangle, Trophy, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useVendedores } from '../../hooks/useVendedores'
import { useInventory } from '../../hooks/useInventory'
import { supabase } from '../../config/supabase'
import { formatBs } from '../../utils/formatters'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const { vendedores } = useVendedores()
  const { products } = useInventory()

  const [stats, setStats] = useState({
    salesTodayBs: 0,
    salesMonthBs: 0,
    totalProductsCount: 0,
    lowStockCount: 0,
  })
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const pendientesCount = vendedores.filter((v) => v.estado === 'pendiente').length

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true)
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        const firstDayMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

        // 1. Ventas de Hoy
        const { data: salesToday } = await supabase
          .from('ventas')
          .select('total')
          .eq('estado', 'completada')
          .gte('created_at', `${todayStr}T00:00:00`)

        const todayTotal = (salesToday || []).reduce((s, item) => s + Number(item.total || 0), 0)

        // 2. Ventas del Mes
        const { data: salesMonth } = await supabase
          .from('ventas')
          .select('total')
          .eq('estado', 'completada')
          .gte('created_at', `${firstDayMonthStr}T00:00:00`)

        const monthTotal = (salesMonth || []).reduce((s, item) => s + Number(item.total || 0), 0)

        // 3. Productos e Inventario
        const { count: prodCount } = await supabase
          .from('productos')
          .select('id', { count: 'exact', head: true })

        const { data: allProds } = await supabase
          .from('productos')
          .select('stock, stock_minimo')

        const lowStock = (allProds || []).filter(p => p.stock <= (p.stock_minimo || 5)).length

        setStats({
          salesTodayBs: todayTotal,
          salesMonthBs: monthTotal,
          totalProductsCount: prodCount || 0,
          lowStockCount: lowStock,
        })

        // 4. Gráfico Ventas últimos 7 días
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          const labelStr = d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' })
          days.push({ dateStr, labelStr, totalBs: 0 })
        }

        const sevenDaysAgoStr = days[0].dateStr
        const { data: salesLast7Days } = await supabase
          .from('ventas')
          .select('total, created_at')
          .eq('estado', 'completada')
          .gte('created_at', `${sevenDaysAgoStr}T00:00:00`)

        if (salesLast7Days) {
          salesLast7Days.forEach((sale) => {
            const saleDate = sale.created_at.split('T')[0]
            const dayObj = days.find((d) => d.dateStr === saleDate)
            if (dayObj) {
              dayObj.totalBs += Number(sale.total || 0)
            }
          })
        }

        setChartData(days)

        // 5. Top 5 productos más vendidos del mes
        const { data: topItems } = await supabase
          .from('venta_items')
          .select('cantidad, subtotal_linea, productos(nombre, sku_interno, marca)')
          .limit(50)

        const mapTop = {}
        if (topItems) {
          topItems.forEach((it) => {
            const name = it.productos?.nombre || 'Repuesto'
            if (!mapTop[name]) {
              mapTop[name] = { nombre: name, cantidad: 0, totalBs: 0, marca: it.productos?.marca || 'Genérico' }
            }
            mapTop[name].cantidad += Number(it.cantidad || 0)
            mapTop[name].totalBs += Number(it.subtotal_linea || 0)
          })
        }

        const sortedTop = Object.values(mapTop)
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 5)

        setTopProducts(sortedTop)
      } catch (err) {
        console.error('Error al cargar métricas del Dashboard Admin:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-rose-900/40 via-gray-900 to-gray-900 border border-rose-900/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="danger" className="mb-2">
            🛡️ Panel de Control Administrador
          </Badge>
          <h1 className="text-2xl font-black text-white">
            ¡Hola, {profile?.nombre_completo || 'Administrador'}!
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Centro de monitoreo e inteligencia de negocios de <strong>Motos Service Oraqueni</strong>.
          </p>
        </div>

        <Link
          to="/admin/panel/negocio"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold text-gray-200 transition-colors shrink-0"
        >
          <Settings size={16} className="text-rose-400" />
          <span>Configuración Sistema</span>
        </Link>
      </div>

      {/* Alerta de Solicitudes Pendientes */}
      {pendientesCount > 0 && (
        <Card className="p-4 bg-amber-950/30 border-amber-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-100">
                {pendientesCount} Solicitud(es) de Vendedor Pendiente(s)
              </h4>
              <p className="text-xs text-amber-300/80">
                Nuevos registros pendientes de aprobación para operar en la plataforma.
              </p>
            </div>
          </div>
          <Link
            to="/admin/vendedores"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-gray-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition-colors"
          >
            Aprobar
          </Link>
        </Card>
      )}

      {/* Tarjetas de Resumen de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Ventas de Hoy</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
              {formatBs(stats.salesTodayBs)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Ventas del Mes</span>
            <span className="text-xl font-black text-rose-400 font-mono mt-1 block">
              {formatBs(stats.salesMonthBs)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Total Productos</span>
            <span className="text-xl font-black text-blue-400 font-mono mt-1 block">
              {stats.totalProductsCount} repuestos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package size={20} />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Stock Bajo</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
              {stats.lowStockCount} ítems
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </Card>
      </div>

      {/* Gráfico de Ventas y Top 5 Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 7 Días */}
        <Card className="lg:col-span-8 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-rose-500" />
              Tendencia de Ventas (Últimos 7 días)
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">Moneda: Bolivianos (Bs.)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="labelStr" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px', color: '#fff' }}
                  formatter={(value) => [`Bs. ${Number(value).toFixed(2)}`, 'Venta Total']}
                />
                <Area type="monotone" dataKey="totalBs" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top 5 Productos Más Vendidos */}
        <Card className="lg:col-span-4 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-3">
              <Trophy size={18} className="text-amber-400" />
              Top 5 Más Vendidos
            </h3>

            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">No hay registros de ventas suficientes.</p>
            ) : (
              <div className="space-y-3 divide-y divide-gray-800">
                {topProducts.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-200 block truncate max-w-[150px]">
                        {idx + 1}. {item.nombre}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{item.marca}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-400 block font-mono">{item.cantidad} un.</span>
                      <span className="text-[10px] text-gray-400 block font-mono">{formatBs(item.totalBs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/admin/inventario"
            className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1 pt-3 border-t border-gray-800"
          >
            <span>Ver Inventario Completo</span>
            <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      {/* Módulos de Acceso Rápido */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Módulos Principales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/vendedores" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-4 flex flex-col justify-between">
              <div>
                <Users size={24} className="text-rose-400 mb-2" />
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-rose-400">
                  Panel de Vendedores
                </h3>
                <p className="text-xs text-gray-400 mt-1">Aprobar, suspender y administrar cuentas.</p>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>Gestionar</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/ventas" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-4 flex flex-col justify-between">
              <div>
                <TrendingUp size={24} className="text-emerald-400 mb-2" />
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-emerald-400">
                  Ventas y Reportes
                </h3>
                <p className="text-xs text-gray-400 mt-1">Margen de ganancia y ventas por vendedor.</p>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Ver Reportes</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/inventario" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-4 flex flex-col justify-between">
              <div>
                <Package size={24} className="text-amber-400 mb-2" />
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-amber-400">
                  Inventario Global
                </h3>
                <p className="text-xs text-gray-400 mt-1">Catálogo de repuestos y stock en vivo.</p>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Ver Catálogo</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/admin/proveedores" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-4 flex flex-col justify-between">
              <div>
                <Truck size={24} className="text-blue-400 mb-2" />
                <h3 className="font-bold text-sm text-gray-100 group-hover:text-blue-400">
                  Proveedores e IA
                </h3>
                <p className="text-xs text-gray-400 mt-1">Lectura de listas PDF de precios con Gemini AI.</p>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-blue-400 font-semibold">
                <span>Gestionar</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
