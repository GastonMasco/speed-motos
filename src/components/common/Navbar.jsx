import { memo } from 'react'
import { Menu, LogOut, Wrench, Shield, UserCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'
import { ROLES } from '../../utils/constants'

export const Navbar = memo(({ onToggleSidebar }) => {
  const { profile, logout, isAdmin } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-xs border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-900/40">
              <Wrench size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                MOTOS SERVICE
              </span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-1 font-medium">ORAQUENI</span>
            </div>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-200">
                {profile.full_name || profile.email}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <Badge variant="danger" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                    <Shield size={10} /> ADMIN
                  </Badge>
                ) : (
                  <Badge variant="info" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                    <UserCheck size={10} /> VENDEDOR
                  </Badge>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
})

Navbar.displayName = 'Navbar'
