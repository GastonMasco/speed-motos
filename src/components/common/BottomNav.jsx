import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, ShoppingCart, Package, Receipt, TrendingUp, Truck, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const BottomNav = memo(() => {
  const { isAdmin } = useAuth()

  // Opciones de navegación para Vendedor
  const vendedorNav = [
    { to: '/vendedor/inicio', label: 'Inicio', icon: Home },
    { to: '/vendedor/vender', label: 'Vender', icon: ShoppingCart },
    { to: '/vendedor/inventario', label: 'Inventario', icon: Package },
    { to: '/vendedor/ventas', label: 'Mis Ventas', icon: Receipt },
  ]

  // Opciones de navegación para Admin
  const adminNav = [
    { to: '/admin/inicio', label: 'Inicio', icon: Home },
    { to: '/admin/ventas', label: 'Ventas', icon: TrendingUp },
    { to: '/admin/inventario', label: 'Inventario', icon: Package },
    { to: '/admin/proveedores', label: 'Proveedores', icon: Truck },
    { to: '/admin/vendedores', label: 'Panel', icon: Users },
  ]

  const navItems = isAdmin ? adminNav : vendedorNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-2 py-1.5 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-150 select-none
                ${isActive
                  ? 'text-rose-500 font-bold scale-105'
                  : 'text-gray-400 hover:text-gray-200'}
              `}
            >
              <Icon size={20} className="mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
})

BottomNav.displayName = 'BottomNav'
