import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Wrench, FileText, Users, History, Settings, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'

export const Sidebar = memo(({ isOpen, onClose }) => {
  const { isAdmin } = useAuth()

  const navItems = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/inventario', label: 'Inventario / Repuestos', icon: Package },
    { to: '/ventas', label: 'Punto de Venta (POS)', icon: ShoppingCart },
    { to: isAdmin ? '/admin/ventas' : '/vendedor/ventas', label: 'Historial & Reportes', icon: History },
    { to: '/reparaciones', label: 'Taller Reparaciones', icon: Wrench },
    { to: '/pdf-ai', label: 'Lector PDF Lista (IA)', icon: FileText },
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin/vendedores', label: 'Gestión Vendedores', icon: Users })
    navItems.push({ to: '/admin/configuracion', label: 'Configuración & Datos', icon: Settings })
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 md:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 md:hidden">
          <span className="font-bold text-sm text-gray-200">Menú Navegación</span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Módulos del Sistema
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150
                    ${isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 font-bold'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-800 bg-gray-950/40">
          <div className="text-[11px] text-gray-500 text-center">
            Motos Service Oraqueni PWA v1.0
            <br />
            <span className="text-gray-400">La Paz, Bolivia (Bs.)</span>
          </div>
        </div>
      </aside>
    </>
  )
})

Sidebar.displayName = 'Sidebar'
