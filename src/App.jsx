import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/common/Layout'
import { LoadingSpinner } from './components/common/LoadingSpinner'

// Cargas perezosas (Lazy Loading)
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'))
const PendingPage = lazy(() => import('./pages/Auth/PendingPage'))

// Módulos Admin (Fase 1, 4 y 5)
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage'))
const AdminVendedoresPage = lazy(() => import('./pages/Admin/AdminVendedoresPage'))
const AdminProveedoresPage = lazy(() => import('./pages/Admin/AdminProveedoresPage'))
const AdminConfiguracionPage = lazy(() => import('./pages/Admin/AdminConfiguracionPage'))

// Módulos Compartidos, Inventario, Ventas y Taller (Fases 2, 3 y Especiales)
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage'))
const SalesPage = lazy(() => import('./pages/Sales/SalesPage'))
const HistoryPage = lazy(() => import('./pages/Sales/HistoryPage'))
const RepairsPage = lazy(() => import('./pages/Repairs/RepairsPage'))
const PdfScannerPage = lazy(() => import('./pages/PdfAi/PdfScannerPage'))

// Módulos Vendedor (Fase 1)
const VendedorDashboardPage = lazy(() => import('./pages/Vendedor/VendedorDashboardPage'))

// Placeholder para módulos de fases siguientes
const PlaceholderPage = lazy(() => import('./pages/Common/PlaceholderPage'))

// Redirección raíz inteligente según el rol del usuario
function RootRedirect() {
  const { profile, isAdmin, loading } = useAuth()
  if (loading) return <LoadingSpinner label="Redirigiendo..." />
  if (isAdmin) return <Navigate to="/admin/inicio" replace />
  return <Navigate to="/vendedor/inicio" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner label="Cargando aplicación..." />}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/pendiente" element={<PendingPage />} />

            {/* Rutas Protegidas dentro de Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Redirección dinámica raíz */}
              <Route index element={<RootRedirect />} />

              {/* Rutas Genéricas */}
              <Route
                path="inventario"
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas"
                element={
                  <ProtectedRoute>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reparaciones"
                element={
                  <ProtectedRoute>
                    <RepairsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pdf-ai"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PdfScannerPage />
                  </ProtectedRoute>
                }
              />

              {/* RUTAS ADMINISTRADOR */}
              <Route
                path="admin/inicio"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/vendedores"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVendedoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/vender"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/ventas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/inventario"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/proveedores"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProveedoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/configuracion"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminConfiguracionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/panel/negocio"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminConfiguracionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/panel/precios"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminConfiguracionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/panel/datos"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminConfiguracionPage />
                  </ProtectedRoute>
                }
              />

              {/* RUTAS VENDEDOR */}
              <Route
                path="vendedor/inicio"
                element={
                  <ProtectedRoute allowedRoles={['vendedor']}>
                    <VendedorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="vendedor/vender"
                element={
                  <ProtectedRoute allowedRoles={['vendedor']}>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="vendedor/inventario"
                element={
                  <ProtectedRoute allowedRoles={['vendedor']}>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="vendedor/ventas"
                element={
                  <ProtectedRoute allowedRoles={['vendedor']}>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

