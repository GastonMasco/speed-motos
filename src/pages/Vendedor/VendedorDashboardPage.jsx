import { Link } from 'react-router-dom'
import { ShoppingCart, Package, Receipt, ArrowRight, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function VendedorDashboardPage() {
  const { profile } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-rose-950/40 border border-gray-800 rounded-2xl p-6">
        <Badge variant="info" className="mb-2">
          ✓ Vendedor Activo
        </Badge>
        <h1 className="text-2xl font-black text-white">
          ¡Hola, {profile?.nombre_completo || 'Vendedor'}!
        </h1>
        <p className="text-xs text-gray-300 mt-1">
          Panel de ventas para <strong>Speed Rao Motos</strong> (Cochabamba, Bolivia).
        </p>
      </div>

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Opciones de Vendedor
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/vendedor/vender" className="group">
            <Card className="h-full hover:border-rose-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <ShoppingCart size={30} className="text-rose-400 mb-3" />
                <h3 className="font-bold text-base text-gray-100 group-hover:text-rose-400">
                  Realizar una Venta
                </h3>
                <p className="text-xs text-gray-400 mt-1">Punto de venta (POS) rápido para cobro de repuestos.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-rose-400 font-bold">
                <span>Ingresar al POS</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/vendedor/inventario" className="group">
            <Card className="h-full hover:border-amber-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <Package size={30} className="text-amber-400 mb-3" />
                <h3 className="font-bold text-base text-gray-100 group-hover:text-amber-400">
                  Consultar Inventario
                </h3>
                <p className="text-xs text-gray-400 mt-1">Busca repuestos, precios en Bs. y niveles de stock.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Ver Catálogo</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link to="/vendedor/ventas" className="group">
            <Card className="h-full hover:border-emerald-500/50 transition-all p-5 flex flex-col justify-between">
              <div>
                <Receipt size={30} className="text-emerald-400 mb-3" />
                <h3 className="font-bold text-base text-gray-100 group-hover:text-emerald-400">
                  Mis Ventas
                </h3>
                <p className="text-xs text-gray-400 mt-1">Historial de transacciones procesadas por tu usuario.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span>Ver Historial</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
