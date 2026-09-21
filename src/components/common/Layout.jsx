import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { OfflineBadge } from './OfflineBadge'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100 relative">
      <OfflineBadge />
      <Navbar />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
